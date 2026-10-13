import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decalerJour, jourParis, joursDeLaSemaine, minuitParis, serieDeJours } from '@/lib/dates'
import { estPilier, type Pilier } from '@/lib/contenu'
import { PHOTO_MANUELLA } from '@/lib/marque'
import Bilan, { type DonneesBilan } from '../composants/bilan/Bilan'

const NOMS_RESEAUX: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  snapchat: 'Snapchat',
  facebook: 'Facebook',
  x: 'X',
  pinterest: 'Pinterest',
  autre: 'Autre',
}

export default function Page() {
  return (
    <Suspense fallback={<div className="fond-rubis fixed inset-0" role="status" aria-label="Préparation de ton bilan" />}>
      <DonneesDuBilan />
    </Suspense>
  )
}

type ThemeLie = { pilier: string | null } | null

// Le mot de fin dépend de la semaine : jamais de reproche, toujours une grande sœur
function motDeFin(publies: number, prepares: number) {
  if (publies >= 3) return 'Quelle semaine. Tu as montré que la régularité, c’est toi. Sois fière, vraiment.'
  if (publies > 0) return 'Tu as avancé, et chaque vidéo publiée compte. La semaine prochaine, on continue ensemble.'
  if (prepares > 0) return 'Tu as semé cette semaine. Les graines ne se voient pas tout de suite, mais elles poussent.'
  return 'Une semaine plus calme, c’est aussi prendre soin de toi. Ta communauté t’attend, sans pression.'
}

async function DonneesDuBilan() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const aujourdhui = jourParis()
  const jours = joursDeLaSemaine(aujourdhui)
  const debut = minuitParis(jours[0])
  const depuis = decalerJour(aujourdhui, -120)

  const [profil, publies, crees, fiches, prevus, reseaux, historique, anglais, actifsSujets, actifsFiches] = await Promise.all([
    supabase.from('profil').select('nom, photo_url').eq('id', user.id).single(),
    supabase.from('sujets').select('titre, date_publication, themes(pilier)').gte('date_publication', debut).order('date_publication'),
    supabase.from('sujets').select('id', { count: 'exact', head: true }).gte('created_at', debut),
    supabase.from('fiches').select('id', { count: 'exact', head: true }).gte('created_at', debut),
    supabase.from('calendrier').select('sujet:sujet_id(themes(pilier))').gte('date_prevue', jours[0]).lte('date_prevue', jours[6]),
    supabase.from('reseaux').select('id, plateforme, abonnes'),
    supabase.from('historique_abonnes').select('reseau_id, abonnes, releve_le').lt('releve_le', debut).order('releve_le', { ascending: false }).limit(200),
    supabase.from('anglais').select('niveau, mois').order('mois', { ascending: false }).limit(1),
    supabase.from('sujets').select('created_at, date_publication').or(`created_at.gte.${depuis},date_publication.gte.${depuis}`),
    supabase.from('fiches').select('created_at').gte('created_at', depuis),
  ])

  const listePublies = (publies.data ?? []) as unknown as { titre: string; date_publication: string; themes: ThemeLie }[]

  // Équilibre des piliers : ce qui est publié ou prévu cette semaine
  const piliers: Record<Pilier, number> = { soin: 0, mental: 0, evoluer: 0 }
  const compter = (p: unknown) => estPilier(p) && piliers[p]++
  for (const s of listePublies) compter(s.themes?.pilier)
  for (const l of (prevus.data ?? []) as unknown as { sujet: { themes: ThemeLie } | null }[]) compter(l.sujet?.themes?.pilier)

  // Abonnés gagnés : valeur actuelle moins le dernier relevé d'avant lundi
  const avantLundi = new Map<string, number>()
  for (const h of historique.data ?? []) if (!avantLundi.has(h.reseau_id)) avantLundi.set(h.reseau_id, h.abonnes)
  const listeReseaux = (reseaux.data ?? []).map((r) => ({
    nom: NOMS_RESEAUX[r.plateforme] ?? r.plateforme,
    plateforme: r.plateforme as string,
    abonnes: r.abonnes as number,
    gain: avantLundi.has(r.id) ? r.abonnes - avantLundi.get(r.id)! : null,
  }))

  // Jours actifs : sujet créé, fiche créée ou contenu publié
  const actifs = new Set<string>()
  for (const s of actifsSujets.data ?? []) {
    actifs.add(jourParis(s.created_at))
    if (s.date_publication) actifs.add(jourParis(s.date_publication))
  }
  for (const f of actifsFiches.data ?? []) actifs.add(jourParis(f.created_at))

  const prepares = (crees.count ?? 0) + (fiches.count ?? 0)
  const debutJ = new Date(`${jours[0]}T12:00:00Z`)
  const finJ = new Date(`${jours[6]}T12:00:00Z`)
  const mois = (d: Date) => new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' }).format(d)

  const donnees: DonneesBilan = {
    nom: profil.data?.nom ?? 'Manuella',
    photo: profil.data?.photo_url ?? PHOTO_MANUELLA,
    periode:
      mois(debutJ) === mois(finJ)
        ? `du ${debutJ.getUTCDate()} au ${finJ.getUTCDate()} ${mois(finJ)}`
        : `du ${debutJ.getUTCDate()} ${mois(debutJ)} au ${finJ.getUTCDate()} ${mois(finJ)}`,
    publies: listePublies.map((s) => ({ titre: s.titre, pilier: estPilier(s.themes?.pilier) ? (s.themes!.pilier as Pilier) : 'soin' })),
    ideesAjoutees: crees.count ?? 0,
    fichesCreees: fiches.count ?? 0,
    piliers,
    reseaux: listeReseaux,
    serie: serieDeJours(actifs, aujourdhui),
    semaineActive: jours.map((j) => ({ jour: j, actif: actifs.has(j), futur: j > aujourdhui })),
    anglais: anglais.data?.[0] ? { niveau: String(anglais.data[0].niveau), mois: String(anglais.data[0].mois ?? '') } : null,
    motDeFin: motDeFin(listePublies.length, prepares),
  }

  return <Bilan donnees={donnees} />
}
