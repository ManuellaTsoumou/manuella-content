import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererFiche, LIBELLES } from '@/lib/agent/fiche'

// La recherche web et l'écriture peuvent prendre jusqu'à une minute ou deux
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erreur: 'Connecte-toi pour générer une fiche.' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { erreur: 'La clé ANTHROPIC_API_KEY manque dans tes variables d’environnement.' },
      { status: 500 }
    )
  }

  const corps = await request.json().catch(() => null)
  const sujetId = String(corps?.sujetId ?? '')
  const format = corps?.format as keyof typeof LIBELLES.format
  const decor = corps?.decor as keyof typeof LIBELLES.decor
  const mode = corps?.mode as keyof typeof LIBELLES.mode
  if (!sujetId || !(format in LIBELLES.format) || !(decor in LIBELLES.decor) || !(mode in LIBELLES.mode)) {
    return NextResponse.json({ erreur: 'Choisis un format, un décor et un mode.' }, { status: 400 })
  }

  const { data: sujet } = await supabase
    .from('sujets')
    .select('id, titre, statut, angle, theme_id, themes(nom)')
    .eq('id', sujetId)
    .single()
  if (!sujet) return NextResponse.json({ erreur: 'Sujet introuvable.' }, { status: 404 })

  const theme = (sujet.themes as unknown as { nom: string } | null)?.nom ?? null

  const { data: journal } = await supabase
    .from('journal_agent')
    .insert({ user_id: user.id })
    .select('id')
    .single()

  try {
    const fiche = await genererFiche({ titre: sujet.titre, theme, format, decor, mode })

    const { data: nouvelleFiche } = await supabase
      .from('fiches')
      .insert({
        sujet_id: sujet.id,
        format,
        decor,
        mode,
        hook: fiche.hook,
        script: fiche.script,
        description: fiche.description,
        hashtags: fiche.hashtags ?? [],
      })
      .select('id')
      .single()

    if (fiche.apprentissages?.length) {
      await supabase.from('apprentissages').insert(
        fiche.apprentissages.map((a) => ({
          sujet_id: sujet.id,
          notion: a.notion,
          resume: a.resume,
          a_verifier: a.a_verifier,
          sources: a.sources ?? [],
        }))
      )
    }

    // Les sujets connexes rejoignent ta banque comme nouvelles idées
    let connexesCrees = 0
    for (const titre of (fiche.sujets_connexes ?? []).slice(0, 3)) {
      const { data: connexe } = await supabase
        .from('sujets')
        .insert({ titre, theme_id: sujet.theme_id, statut: 'idee', origine: 'agent' })
        .select('id')
        .single()
      if (connexe) {
        connexesCrees++
        await supabase.from('sujets_connexes').insert({ sujet_id: sujet.id, connexe_id: connexe.id })
      }
    }

    await supabase
      .from('sujets')
      .update({
        angle: sujet.angle ?? fiche.angle,
        pourquoi_ca_touche: fiche.pourquoi_ca_touche,
        statut: ['idee', 'valide'].includes(sujet.statut) ? 'a_apprendre' : sujet.statut,
      })
      .eq('id', sujet.id)

    if (journal) {
      await supabase
        .from('journal_agent')
        .update({ fin: new Date().toISOString(), statut: 'termine', sujets_crees: connexesCrees })
        .eq('id', journal.id)
    }

    return NextResponse.json({ ficheId: nouvelleFiche?.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue'
    if (journal) {
      await supabase
        .from('journal_agent')
        .update({ fin: new Date().toISOString(), statut: 'erreur', erreur: message })
        .eq('id', journal.id)
    }
    return NextResponse.json(
      { erreur: `L’agent n’a pas pu terminer la fiche : ${message}` },
      { status: 500 }
    )
  }
}
