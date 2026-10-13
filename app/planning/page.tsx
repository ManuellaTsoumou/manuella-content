import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jourParis, joursDeLaSemaine } from '@/lib/dates'
import { estPilier, type Format, type Pilier } from '@/lib/contenu'
import TransitionPage from '../composants/animation/TransitionPage'
import { SkeletonPage } from '../composants/ui/Skeleton'
import Planning, { type Candidat, type ContenuPlanning } from '../composants/planning/Planning'

type Recherche = Promise<{ semaine?: string }>

export default function Page({ searchParams }: { searchParams: Recherche }) {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de ton planning…" cartes={4} />}>
        <DonneesPlanning searchParams={searchParams} />
      </Suspense>
    </TransitionPage>
  )
}

type ThemeLie = { nom: string; pilier: string | null } | null
type SujetLie = { id: string; titre: string; format: string | null; statut: string; themes: ThemeLie } | null
type Ligne = {
  id: string
  date_prevue: string
  heure: string | null
  fiche_id: string | null
  sujet: SujetLie
  fiche: { id: string; format: string | null; sujet: SujetLie } | null
}

async function DonneesPlanning({ searchParams }: { searchParams: Recherche }) {
  await connection()
  const { semaine } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const aujourdhui = jourParis()
  const reference = semaine && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? semaine : aujourdhui
  const jours = joursDeLaSemaine(reference)

  const [calendrier, joursOff, sujets] = await Promise.all([
    supabase
      .from('calendrier')
      .select(
        'id, date_prevue, heure, fiche_id, sujet:sujet_id(id, titre, format, statut, themes(nom, pilier)), fiche:fiche_id(id, format, sujet:sujet_id(id, titre, format, statut, themes(nom, pilier)))'
      )
      .gte('date_prevue', jours[0])
      .lte('date_prevue', jours[6])
      .order('heure', { nullsFirst: false }),
    supabase.from('jours_off').select('jour').gte('jour', jours[0]).lte('jour', jours[6]),
    supabase
      .from('sujets')
      .select('id, titre, format, themes(nom, pilier)')
      .in('statut', ['idee', 'valide', 'a_apprendre', 'tourne'])
      .order('created_at', { ascending: false })
      .limit(80),
  ])

  const pilierDe = (t: ThemeLie): Pilier => (estPilier(t?.pilier) ? (t!.pilier as Pilier) : 'soin')

  const contenus = ((calendrier.data ?? []) as unknown as Ligne[]).flatMap<ContenuPlanning>((l) => {
    const s = l.sujet ?? l.fiche?.sujet
    if (!s) return []
    return [
      {
        id: l.id,
        jour: l.date_prevue,
        heure: l.heure ? l.heure.slice(0, 5) : null,
        sujetId: s.id,
        ficheId: l.fiche?.id ?? l.fiche_id,
        titre: s.titre,
        format: ((l.fiche?.format ?? s.format) as Format | null) ?? null,
        pilier: pilierDe(s.themes),
        theme: s.themes?.nom ?? null,
        publie: s.statut === 'publie',
      },
    ]
  })

  const dejaPrevus = new Set(contenus.map((c) => c.sujetId))
  const candidats = ((sujets.data ?? []) as unknown as { id: string; titre: string; format: string | null; themes: ThemeLie }[])
    .filter((s) => !dejaPrevus.has(s.id))
    .map<Candidat>((s) => ({
      id: s.id,
      titre: s.titre,
      format: (s.format as Format | null) ?? null,
      pilier: pilierDe(s.themes),
      theme: s.themes?.nom ?? null,
    }))

  return (
    <Planning
      key={jours[0]}
      jours={jours}
      aujourdhui={aujourdhui}
      off={(joursOff.data ?? []).map((j) => j.jour as string)}
      contenus={contenus}
      candidats={candidats}
    />
  )
}
