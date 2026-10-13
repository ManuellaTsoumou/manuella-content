import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  CONSIGNES_AGENT,
  MODELE_AGENT,
  NOM_OUTIL,
  contexteDuMoment,
  outilPropositions,
  resultatsOutils,
  validerPropositions,
} from '@/lib/agent/conversation'

// Une réponse peut prendre un moment : on laisse de la marge
export const maxDuration = 120

type Historique = Anthropic.Beta.BetaMessageParam[]

// Chaque ligne envoyée au navigateur est un petit objet JSON (une ligne = un évènement)
const ligne = (objet: unknown) => new TextEncoder().encode(JSON.stringify(objet) + '\n')

// Table absente : le fichier SQL de la mémoire n'a pas encore été lancé
const tableAbsente = (code?: string) => code === '42P01' || code === 'PGRST205'

export async function POST(requete: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ erreur: 'Connecte-toi pour parler à ton agent.' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ erreur: 'La clé ANTHROPIC_API_KEY manque dans tes variables d’environnement.' }, { status: 500 })
  }

  const corps = await requete.json().catch(() => null)
  const texte = String(corps?.message ?? '').trim().slice(0, 4000)
  let conversationId = typeof corps?.conversationId === 'string' ? corps.conversationId : null
  if (!texte) return Response.json({ erreur: 'Écris-moi quelque chose !' }, { status: 400 })

  // Mémoire : on reprend la conversation, ou on en commence une
  let historique: Historique = []
  if (conversationId) {
    const { data, error } = await supabase.from('conversations_agent').select('messages').eq('id', conversationId).single()
    if (tableAbsente(error?.code)) return Response.json({ erreur: 'memoire_absente' }, { status: 503 })
    historique = (data?.messages as Historique | null) ?? []
    if (!data) conversationId = null
  }

  // Les cartes du tour précédent sont confirmées, puis vient le nouveau message
  const nouveauMessage: Anthropic.Beta.BetaMessageParam = {
    role: 'user',
    content: [...resultatsOutils(historique.at(-1)), { type: 'text', text: texte }],
  }
  const messages: Historique = [...historique, nouveauMessage]

  const [{ data: themes }, { data: sujets }] = await Promise.all([
    supabase.from('themes').select('nom, pilier').order('ordre'),
    supabase.from('sujets').select('titre').neq('statut', 'rejete').order('created_at', { ascending: false }).limit(60),
  ])

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const flux = new ReadableStream<Uint8Array>({
    async start(controle) {
      try {
        const stream = client.beta.messages.stream({
          model: MODELE_AGENT,
          max_tokens: 32000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          // Repli automatique sur un autre modèle si une demande est déclinée par les filtres de sécurité
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: [
            { type: 'text', text: CONSIGNES_AGENT, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: contexteDuMoment(themes ?? [], (sujets ?? []).map((s) => s.titre)) },
          ],
          tools: [outilPropositions((themes ?? []).map((t) => t.nom))],
          messages,
        })

        // La réponse s'écrit au fur et à mesure
        for await (const evenement of stream) {
          if (evenement.type === 'content_block_start' && evenement.content_block.type === 'tool_use') {
            controle.enqueue(ligne({ t: 'preparation' }))
          }
          if (evenement.type === 'content_block_delta' && evenement.delta.type === 'text_delta') {
            controle.enqueue(ligne({ t: 'texte', d: evenement.delta.text }))
          }
        }

        const reponse = await stream.finalMessage()

        if (reponse.stop_reason === 'refusal') {
          controle.enqueue(ligne({ t: 'erreur', message: 'Je ne peux pas t’aider sur ce point. Essaie de reformuler ta demande autrement.' }))
          controle.close()
          return
        }

        // Propositions validées avant affichage ; une réponse coupée (max_tokens) n'en montre aucune
        const propositions =
          reponse.stop_reason === 'max_tokens'
            ? []
            : reponse.content
                .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use' && b.name === NOM_OUTIL)
                .flatMap((b) => validerPropositions(b.input) ?? [])
        if (propositions.length) controle.enqueue(ligne({ t: 'propositions', sujets: propositions }))

        // Mémoire : on ajoute l'échange tel quel (le contenu complet, pour pouvoir reprendre la conversation)
        const suite: Historique = [...messages, { role: 'assistant', content: reponse.content as Anthropic.Beta.BetaContentBlockParam[] }]
        if (conversationId) {
          await supabase.from('conversations_agent').update({ messages: suite }).eq('id', conversationId)
        } else {
          const { data, error } = await supabase
            .from('conversations_agent')
            .insert({ user_id: user.id, titre: texte.slice(0, 60), messages: suite })
            .select('id')
            .single()
          if (tableAbsente(error?.code)) controle.enqueue(ligne({ t: 'memoire_absente' }))
          conversationId = data?.id ?? null
        }

        controle.enqueue(ligne({ t: 'fin', conversationId }))
      } catch (e) {
        const message =
          e instanceof Anthropic.RateLimitError
            ? 'Beaucoup de demandes d’un coup : attends quelques secondes et réessaie.'
            : e instanceof Anthropic.AuthenticationError
              ? 'La clé de l’IA n’est pas valide. Vérifie ANTHROPIC_API_KEY dans tes réglages.'
              : 'Je n’ai pas réussi à te répondre cette fois. Réessaie dans un instant.'
        console.error('Agent IA :', e)
        controle.enqueue(ligne({ t: 'erreur', message }))
      }
      controle.close()
    },
  })

  return new Response(flux, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
