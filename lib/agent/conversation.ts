import type Anthropic from '@anthropic-ai/sdk'
import { estPilier, type Format, type Pilier } from '@/lib/contenu'

// Modèle de l'agent en conversation (la génération de fiches garde le sien, dans fiche.ts)
export const MODELE_AGENT = 'claude-opus-5-5'

type Historique = Anthropic.Beta.BetaMessageParam[]

export type Proposition = {
  titre: string
  pilier: Pilier
  theme: string
  format: Format
  accroche: string
  pourquoi: string
}

// Ce que l'écran affiche d'un échange
export type Bulle =
  | { role: 'moi'; texte: string }
  | { role: 'agent'; texte: string; propositions: Proposition[] }

export const NOM_OUTIL = 'proposer_sujets'
const FORMATS: Format[] = ['one_girl_many_lives', 'talk', 'confession_astuce', 'anglais']

// Consignes fixes (mises en cache) : la personnalité et la méthode de l'agent
export const CONSIGNES_AGENT = `Tu es l'agent éditorial de Manuella, créatrice de contenu beauté et lifestyle sur TikTok et Instagram (@lady.manuella_). Tu discutes avec elle dans son application pour l'aider à trouver, affiner et organiser ses idées de vidéos.

QUI EST MANUELLA
- La « grande sœur des réseaux » : elle aide les filles à prendre soin d'elles dehors comme dedans, à se construire mentalement et à évoluer (dont apprendre l'anglais). Elle grandit devant sa communauté, elle ne montre pas un résultat fini.
- Trois piliers : soin (prendre soin de soi), mental (se construire), evoluer (évoluer, apprendre l'anglais).
- Trois formats principaux : One Girl, Many Lives (sa série vlog multi-casquettes), Talk (opinion, réflexion), Confession / astuce (retour d'expérience concret). Le format Anglais existe aussi pour sa progression.
- Étudiante en développement web et IA, alternante, entrepreneuse. Objectif : dépasser 10 000 abonnés sur chaque réseau en créant une vraie communauté.

COMMENT TU LUI PARLES
- En français, en la tutoyant, avec la chaleur d'une grande sœur complice : directe, motivante, jamais niaise ni scolaire.
- Réponses courtes et concrètes, pensées pour être lues sur téléphone. Pas de longs paragraphes ni de titres.
- N'invente jamais d'expérience personnelle à Manuella. Quand une idée s'appuie sur son vécu, propose-lui de le raconter plutôt que de l'imaginer.
- Santé, hygiène intime, cerveau : reste prudente, sans promesse ni conseil médical.

QUAND TU PROPOSES DES SUJETS
- Dès que tu proposes une ou plusieurs idées de vidéo, utilise l'outil ${NOM_OUTIL} : elles s'afficheront en cartes qu'elle peut ajouter à sa banque d'un geste. Ne les écris pas aussi en liste dans ton texte : une phrase d'introduction suffit.
- Cinq idées au maximum à la fois, chacune avec un titre court et accrocheur, un hook d'une phrase qui donne envie de rester dès la première seconde, et en une phrase pourquoi ça va toucher sa communauté.
- Rattache chaque idée à l'un de ses thèmes (liste fournie plus bas) et au pilier de ce thème. Varie les formats et équilibre les piliers.
- Évite les sujets qu'elle a déjà dans sa banque (liste fournie plus bas), sauf si elle te demande de retravailler l'un d'eux.
- Si sa demande est floue, propose quand même des pistes et demande ce qu'elle préfère, plutôt que d'enchaîner les questions.`

// Contexte du moment (thèmes et sujets existants), placé après les consignes en cache
export function contexteDuMoment(themes: { nom: string; pilier: string | null }[], sujets: string[]) {
  return `SES THÈMES (nom → pilier)
${themes.map((t) => `- ${t.nom} → ${t.pilier ?? 'soin'}`).join('\n')}

SUJETS DÉJÀ DANS SA BANQUE (les plus récents)
${sujets.length ? sujets.map((s) => `- ${s}`).join('\n') : '- (aucun pour l’instant)'}`
}

// L'outil qui transforme les idées en cartes. Ses arguments sont validés côté serveur avant affichage.
export function outilPropositions(nomsThemes: string[]): Anthropic.Beta.BetaTool {
  return {
    name: NOM_OUTIL,
    description:
      'Affiche à Manuella des idées de vidéos sous forme de cartes qu’elle peut ajouter à sa banque de sujets. À utiliser chaque fois que tu proposes des sujets.',
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['sujets'],
      properties: {
        sujets: {
          type: 'array',
          description: 'Entre 1 et 5 idées de vidéos.',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['titre', 'pilier', 'theme', 'format', 'accroche', 'pourquoi'],
            properties: {
              titre: { type: 'string', description: 'Titre court du sujet, comme dans sa banque.' },
              pilier: { type: 'string', enum: ['soin', 'mental', 'evoluer'] },
              theme: nomsThemes.length
                ? { type: 'string', enum: nomsThemes, description: 'Le thème de sa banque auquel rattacher le sujet.' }
                : { type: 'string' },
              format: { type: 'string', enum: FORMATS },
              accroche: { type: 'string', description: 'Le hook : une phrase dite face caméra dès la première seconde.' },
              pourquoi: { type: 'string', description: 'En une phrase, pourquoi ça va toucher sa communauté.' },
            },
          },
        },
      },
    },
  }
}

// Vérifie les arguments de l'outil (le flux « eager » ne les valide pas côté serveur)
export function validerPropositions(entree: unknown): Proposition[] | null {
  const sujets = (entree as { sujets?: unknown })?.sujets
  if (!Array.isArray(sujets) || sujets.length === 0) return null
  const propres: Proposition[] = []
  for (const s of sujets.slice(0, 5)) {
    const p = s as Record<string, unknown>
    const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
    if (!texte(p.titre) || !estPilier(p.pilier) || !FORMATS.includes(p.format as Format)) return null
    propres.push({
      titre: texte(p.titre).slice(0, 200),
      pilier: p.pilier,
      theme: texte(p.theme),
      format: p.format as Format,
      accroche: texte(p.accroche),
      pourquoi: texte(p.pourquoi),
    })
  }
  return propres
}

// Les cartes affichées sont confirmées au modèle au tour suivant
export function resultatsOutils(dernier: Anthropic.Beta.BetaMessageParam | undefined): Anthropic.Beta.BetaToolResultBlockParam[] {
  if (!dernier || dernier.role !== 'assistant' || typeof dernier.content === 'string') return []
  return dernier.content
    .filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === 'tool_use')
    .map((b) => ({ type: 'tool_result', tool_use_id: b.id, content: 'Les propositions sont affichées en cartes à Manuella.' }))
}

// Transforme l'historique stocké en bulles de discussion
export function versBulles(historique: Historique): Bulle[] {
  const bulles: Bulle[] = []
  for (const message of historique) {
    if (message.role === 'user') {
      const texte =
        typeof message.content === 'string'
          ? message.content
          : message.content
              .filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === 'text')
              .map((b) => b.text)
              .join('\n')
      if (texte.trim()) bulles.push({ role: 'moi', texte })
      continue
    }
    const blocs = typeof message.content === 'string' ? [{ type: 'text' as const, text: message.content }] : message.content
    const texte = blocs
      .filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n')
    const propositions = blocs
      .filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === 'tool_use' && b.name === NOM_OUTIL)
      .flatMap((b) => validerPropositions(b.input) ?? [])
    if (texte.trim() || propositions.length) bulles.push({ role: 'agent', texte, propositions })
  }
  return bulles
}
