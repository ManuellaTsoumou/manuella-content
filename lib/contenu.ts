// Vocabulaire éditorial partagé : piliers, formats, phrases de grande sœur.

export type Pilier = 'soin' | 'mental' | 'evoluer'
export type Format = 'one_girl_many_lives' | 'talk' | 'confession_astuce' | 'anglais'

export const NOMS_PILIERS: Record<Pilier, string> = {
  soin: 'Soin de soi',
  mental: 'Me construire',
  evoluer: 'Évoluer',
}

export const NOMS_FORMATS: Record<Format, string> = {
  one_girl_many_lives: 'One Girl, Many Lives',
  talk: 'Talk',
  confession_astuce: 'Confession / astuce',
  anglais: 'Anglais',
}

// Palette tonale de chaque pilier (classes écrites en entier pour que Tailwind les trouve)
export const ART: Record<Pilier, string> = { soin: 'art-soin', mental: 'art-mental', evoluer: 'art-evoluer' }

export function nomFormat(format: string | null | undefined) {
  return format && format in NOMS_FORMATS ? NOMS_FORMATS[format as Format] : null
}

export function estPilier(valeur: unknown): valeur is Pilier {
  return valeur === 'soin' || valeur === 'mental' || valeur === 'evoluer'
}

// Numéro éditorial à deux chiffres (« 03 »)
export function numero(ordre: number | null | undefined) {
  return String(ordre ?? 0).padStart(2, '0')
}

// La phrase du jour : reprises mot pour mot de la maquette accueil.html
export const PHRASES_DU_JOUR = [
  'Tu n’as pas besoin d’être parfaite pour inspirer. Tu as juste besoin d’être vraie.',
  'Prends soin de toi comme tu prends soin des autres.',
  'Chaque vidéo est une graine. Toutes ne poussent pas le même jour.',
  'Ta régularité vaut plus que ton perfectionnisme.',
  'Quelqu’un attend exactement le conseil que tu vas donner aujourd’hui.',
  'Grandis devant elles : c’est ça, ta force.',
  'Tu as le droit d’avancer doucement. Tant que tu avances.',
  'Ce que tu vis, d’autres le vivent en silence. Parle pour elles.',
  'Ton histoire est ton meilleur contenu.',
  'Repose-toi quand il le faut, mais n’abandonne pas.',
  'Tu construis quelque chose de grand, une vidéo à la fois.',
  'Sois la grande sœur que tu aurais aimé avoir.',
  // Ajoutées pour atteindre 30 phrases (une par jour du mois)
  'Bois ton verre d’eau, redresse les épaules : on y va.',
  'Tu n’es pas en retard. Tu es exactement là où tu construis.',
  'Une vidéo imparfaite publiée vaut mieux qu’une parfaite jamais tournée.',
  'Ta douceur est une force, pas une faiblesse.',
  'Aujourd’hui, fais une chose pour ton corps et une pour ta tête.',
  'Les chiffres montent lentement. Ton impact, lui, est déjà là.',
  'Parle-toi comme tu parlerais à ta petite sœur.',
  'Le doute est normal. Avance avec lui, pas derrière lui.',
  'Chaque mot d’anglais appris t’ouvre une porte de plus.',
  'Tu as le droit de dire non pour pouvoir dire oui à toi.',
  'Ce n’est pas la motivation qui te porte, ce sont tes petites habitudes.',
  'Quelqu’un va se sentir moins seule grâce à toi aujourd’hui.',
  'Prends soin de ta peau, de ton cœur et de tes rêves. Dans cet ordre si tu veux.',
  'Tu deviens la femme que tu voulais être, une journée à la fois.',
  'Montre le chemin, pas seulement l’arrivée.',
  'Ton authenticité est ton meilleur filtre.',
  'Célèbre tes petites victoires. Elles comptent toutes.',
  'Respire. Tu fais déjà beaucoup, et tu le fais bien.',
]

// Paliers vers les 10 000 abonnés
export const PALIERS = [500, 1000, 2500, 5000, 7500, 10000]

export function prochainPalier(abonnes: number, objectif: number) {
  return PALIERS.find((p) => p > abonnes && p <= objectif) ?? (abonnes < objectif ? objectif : null)
}
