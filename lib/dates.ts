// Toutes les dates de l'app sont calculées à l'heure de Paris, quel que soit le serveur.

const FUSEAU = 'Europe/Paris'

// « 2026-10-08 » pour un instant donné, vu depuis Paris
export function jourParis(instant: Date | string = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instant))
}

export function heureParis(instant = new Date()) {
  return Number(new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, hour: 'numeric', hour12: false }).format(instant))
}

// Ajoute des jours à une date « AAAA-MM-JJ » (calcul à midi UTC : pas de piège d'heure d'été)
export function decalerJour(jour: string, nombre: number) {
  const d = new Date(`${jour}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + nombre)
  return d.toISOString().slice(0, 10)
}

// Les 7 jours de la semaine (lundi → dimanche) qui contient ce jour
export function joursDeLaSemaine(jour: string) {
  const d = new Date(`${jour}T12:00:00Z`)
  const lundi = decalerJour(jour, -((d.getUTCDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => decalerJour(lundi, i))
}

// « Jeudi 8 octobre »
export function dateEnToutesLettres(jour: string) {
  const texte = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${jour}T12:00:00Z`))
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

// Salutation de la maquette : avant midi, avant 18 h, puis le soir
export function salutation(heure: number) {
  return heure < 12 ? 'Bonjour,' : heure < 18 ? 'Bon après-midi,' : 'Bonsoir,'
}

// Numéro du jour dans l'année : sert à faire tourner la phrase du jour
export function jourDeLAnnee(jour: string) {
  const d = new Date(`${jour}T12:00:00Z`)
  const debut = Date.UTC(d.getUTCFullYear(), 0, 0)
  return Math.floor((d.getTime() - debut) / 86_400_000)
}

// Série : nombre de jours actifs d'affilée jusqu'à aujourd'hui.
// Si rien n'a encore été fait aujourd'hui, la série d'hier compte toujours (la journée n'est pas finie).
export function serieDeJours(joursActifs: Iterable<string>, aujourdhui: string) {
  const actifs = new Set(joursActifs)
  let jour = actifs.has(aujourdhui) ? aujourdhui : decalerJour(aujourdhui, -1)
  let serie = 0
  while (actifs.has(jour)) {
    serie++
    jour = decalerJour(jour, -1)
  }
  return serie
}
