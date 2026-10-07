import Anthropic from '@anthropic-ai/sdk'

export const MODELE = 'claude-sonnet-5-5'

export type FicheGeneree = {
  angle: string
  pourquoi_ca_touche: string
  hook: string
  script: string
  description: string
  hashtags: string[]
  apprentissages: {
    notion: string
    resume: string
    a_verifier: string
    sources: { titre: string; url: string }[]
  }[]
  sujets_connexes: string[]
}

export const LIBELLES = {
  format: {
    talk: 'Talk (sujet de réflexion, opinion assumée)',
    confession_astuce: 'Confession/astuce (retour d’expérience concret)',
    one_girl_many_lives: 'One Girl, Many Lives (vlog de sa vie multi-casquettes)',
    anglais: 'Anglais (méthode et progression)',
  },
  decor: {
    routine_skincare: 'pendant une routine skincare',
    routine_clean_girl: 'pendant une routine clean girl',
    pendant_makeup: 'pendant qu’elle se maquille',
    face_cam_maquillee: 'face caméra, déjà maquillée',
    vlog: 'en vlog',
    autre: 'décor libre',
  },
  mode: {
    voix_off: 'en voix off posée sur les images',
    face_cam: 'en parlant directement à la caméra',
    sans_parole: 'sans parole, avec du texte à l’écran',
  },
} as const

const CONSIGNES = `Tu es le directeur éditorial et le professeur personnel de Manuella, créatrice de contenu beauté et lifestyle sur TikTok et Instagram (@lady.manuella_).

QUI EST MANUELLA
- La « grande sœur des réseaux » : elle aide les filles à évoluer, à prendre soin d'elles dehors comme dedans (beauté, hygiène, sentir bon, élégance, confiance, concentration, objectifs, anglais).
- Son fil conducteur : « Je deviens la meilleure version de moi, en direct, et je t'emmène avec moi. » Elle montre l'évolution en cours, pas un résultat fini.
- Étudiante en développement web et IA, entrepreneuse, elle apprend l'anglais pour devenir bilingue.
- Ton : élégant, intelligent, accessible. Une grande sœur, jamais une prof. Boss Lady Mindset.
- Objectif : créer une vraie communauté de filles qui commentent, racontent leur expérience et reviennent.

TA MISSION
Pour le sujet donné, tu recherches sur le web (sources fiables : études, institutions de santé, universités, médias reconnus), puis tu prépares une fiche complète.

RÈGLES D'ÉCRITURE
- Tout en français, tutoiement, phrases courtes faites pour être dites à l'oral.
- Le hook tient en une phrase qui donne envie de rester dès la première seconde. Pas de « Dans cette vidéo… ».
- Le script dure 45 à 90 secondes à l'oral, à la première personne, adapté au format, au décor et au mode demandés.
- N'invente JAMAIS d'expérience personnelle à Manuella. Quand le script a besoin de son vécu, écris un repère entre crochets, par exemple [raconte un moment où tu as douté de toi].
- Termine le script par une question qui invite les abonnées à commenter.
- Précise, concrète, jamais générique : des actions qu'on peut faire dès demain.
- Santé, hygiène intime, cerveau : uniquement des informations vérifiées dans tes sources, sans promesse ni conseil médical. Si c'est utile, invite à consulter un professionnel.
- La description fait 2 à 4 lignes et finit par une question.
- 5 à 8 hashtags pertinents en français, sans le #.

APPRENTISSAGES
2 à 4 notions que Manuella doit comprendre avant de tourner. Pour chacune : un résumé clair de 3 à 5 phrases, ce qu'elle doit vérifier ou éviter de dire, et 1 à 3 sources réellement consultées (titre et URL exacte trouvés dans ta recherche, jamais inventés).

SUJETS CONNEXES
3 idées de vidéos suivantes, formulées comme des titres courts.

FORMAT DE RÉPONSE
Après ta recherche, réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises de code :
{"angle":"","pourquoi_ca_touche":"","hook":"","script":"","description":"","hashtags":[""],"apprentissages":[{"notion":"","resume":"","a_verifier":"","sources":[{"titre":"","url":""}]}],"sujets_connexes":[""]}`

export async function genererFiche(params: {
  titre: string
  theme: string | null
  format: keyof typeof LIBELLES.format
  decor: keyof typeof LIBELLES.decor
  mode: keyof typeof LIBELLES.mode
}): Promise<FicheGeneree> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const demande = `Sujet : ${params.titre}
Thème : ${params.theme ?? 'non précisé'}
Format : ${LIBELLES.format[params.format]}
Décor : ${LIBELLES.decor[params.decor]}
Mode : ${LIBELLES.mode[params.mode]}`

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: demande }]

  // La recherche web peut demander plusieurs tours (pause_turn) : on relance jusqu'à 3 fois
  let reponse: Anthropic.Message | null = null
  for (let tour = 0; tour < 3; tour++) {
    reponse = await client.messages.create({
      model: MODELE,
      max_tokens: 6000,
      system: CONSIGNES,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages,
    })
    if (reponse.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: reponse.content })
  }

  if (!reponse) throw new Error('Aucune réponse de l’agent.')

  const texte = reponse.content
    .filter((bloc): bloc is Anthropic.TextBlock => bloc.type === 'text')
    .map((bloc) => bloc.text)
    .join('')

  const debut = texte.indexOf('{')
  const fin = texte.lastIndexOf('}')
  if (debut === -1 || fin === -1) throw new Error('La réponse de l’agent ne contient pas de fiche.')

  return JSON.parse(texte.slice(debut, fin + 1)) as FicheGeneree
}
