import type { Format, Pilier } from './contenu'

export type SujetCandidat = {
  id: string
  titre: string
  statut: string
  format: Format | null
  pilier: Pilier | null
  theme: string | null
  numero: string
}

type Contexte = {
  // Piliers déjà prévus ou publiés cette semaine
  piliersDeLaSemaine: (Pilier | null)[]
  // Formats des derniers contenus (le plus récent en premier)
  formatsRecents: (Format | null)[]
  // Graine du jour : les suggestions restent les mêmes toute la journée
  jour: string
}

// Petit hachage stable : départage les sujets à égalité, différemment chaque jour
function hachage(texte: string) {
  let h = 2166136261
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

// Classe les sujets de la banque pour la « suggestion du jour ».
// Règles : équilibrer les 3 piliers sur la semaine, prioriser les sujets jamais traités,
// alterner les formats. Les sujets déjà au planning sont retirés avant l'appel.
// Renvoie la liste ordonnée : les 3 premiers s'affichent, les suivants servent à « Pas aujourd'hui ».
export function classerSuggestions(candidats: SujetCandidat[], { piliersDeLaSemaine, formatsRecents, jour }: Contexte) {
  const compte: Record<Pilier, number> = { soin: 0, mental: 0, evoluer: 0 }
  for (const p of piliersDeLaSemaine) if (p) compte[p]++
  const max = Math.max(compte.soin, compte.mental, compte.evoluer)
  const dernierFormat = formatsRecents.find(Boolean) ?? null

  const score = (s: SujetCandidat) => {
    let points = 0
    // Le pilier le moins présent cette semaine passe devant
    if (s.pilier) points += 2 * (max - compte[s.pilier])
    // Jamais traité : une idée ou un sujet validé n'a encore rien de prêt
    if (s.statut === 'idee' || s.statut === 'valide') points += 2
    else if (s.statut === 'a_apprendre') points += 1
    // Alterner les formats
    if (s.format && dernierFormat) points += s.format === dernierFormat ? -1 : 1
    return points + hachage(s.id + jour)
  }

  const tries = [...candidats].sort((a, b) => score(b) - score(a))

  // Les 3 premiers : autant que possible un par pilier et des formats différents
  const choisis: SujetCandidat[] = []
  for (const s of tries) {
    if (choisis.length === 3) break
    const memePilier = s.pilier && choisis.some((c) => c.pilier === s.pilier)
    const memeFormat = s.format && choisis.some((c) => c.format === s.format)
    if (!memePilier && !memeFormat) choisis.push(s)
  }
  for (const s of tries) {
    if (choisis.length === 3) break
    if (!choisis.includes(s)) choisis.push(s)
  }

  return [...choisis, ...tries.filter((s) => !choisis.includes(s))]
}
