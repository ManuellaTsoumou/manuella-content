import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  dateEnToutesLettres,
  decalerJour,
  heureParis,
  jourDeLAnnee,
  jourParis,
  joursDeLaSemaine,
  salutation,
  serieDeJours,
} from '@/lib/dates'
import { PHRASES_DU_JOUR, estPilier, numero, type Format, type Pilier } from '@/lib/contenu'
import { classerSuggestions, type SujetCandidat } from '@/lib/suggestions'
import { PHOTO_MANUELLA } from '@/lib/marque'
import TransitionPage from './composants/animation/TransitionPage'
import { SkeletonPage } from './composants/ui/Skeleton'
import Accueil, { type DonneesAccueil, type ContenuPrevu } from './composants/accueil/Accueil'

// Next.js 16 (Cache Components) : les données personnelles se chargent
// dans un bloc Suspense, avec un écran d'attente pendant le chargement.
export default function Page() {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de ton espace…" />}>
        <DonneesDuJour />
      </Suspense>
    </TransitionPage>
  )
}

type ThemeLie = { nom: string; pilier: string | null; ordre: number | null } | null
type SujetLie = { id: string; titre: string; format: string | null; themes: ThemeLie } | null
type LigneCalendrier = {
  id: string
  date_prevue: string
  heure: string | null
  sujet: SujetLie
  fiche: { format: string | null; sujet: SujetLie } | null
}

async function DonneesDuJour() {
  // La date et l'heure de Paris changent à chaque visite : rien ici n'est pré-calculé
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const aujourdhui = jourParis()
  const semaine = joursDeLaSemaine(aujourdhui)
  const lundi = semaine[0]
  const dimanche = semaine[6]
  const depuis = decalerJour(aujourdhui, -120)

  const [profil, reseaux, joursOff, calendrier, candidats, publies, sujetsCrees, fichesCreees, idees] =
    await Promise.all([
      supabase.from('profil').select('nom, photo_url').eq('id', user.id).single(),
      supabase.from('reseaux').select('id, plateforme, pseudo, abonnes, objectif').order('abonnes', { ascending: false }),
      supabase.from('jours_off').select('jour').gte('jour', lundi).lte('jour', dimanche),
      // Tout ce qui est prévu à partir de lundi : la semaine affichée + ce qui est déjà planifié plus tard
      supabase
        .from('calendrier')
        .select(
          'id, date_prevue, heure, sujet:sujet_id(id, titre, format, themes(nom, pilier, ordre)), fiche:fiche_id(format, sujet:sujet_id(id, titre, format, themes(nom, pilier, ordre)))'
        )
        .gte('date_prevue', lundi)
        .order('date_prevue')
        .order('heure', { nullsFirst: false }),
      supabase
        .from('sujets')
        .select('id, titre, statut, format, themes(nom, pilier, ordre)')
        .in('statut', ['idee', 'valide', 'a_apprendre']),
      supabase
        .from('sujets')
        .select('format, date_publication, themes(pilier)')
        .gte('date_publication', `${depuis}T00:00:00Z`)
        .order('date_publication', { ascending: false }),
      supabase.from('sujets').select('created_at').gte('created_at', `${depuis}T00:00:00Z`),
      supabase.from('fiches').select('created_at').gte('created_at', `${depuis}T00:00:00Z`),
      supabase.from('sujets').select('*', { count: 'exact', head: true }).eq('statut', 'idee'),
    ])

  // --- Planning ---
  const lignes = (calendrier.data ?? []) as unknown as LigneCalendrier[]
  const sujetDe = (l: LigneCalendrier) => l.sujet ?? l.fiche?.sujet ?? null
  const prevus = new Set(lignes.map((l) => sujetDe(l)?.id).filter(Boolean))
  const offs = new Set((joursOff.data ?? []).map((j) => j.jour as string))

  const contenusDuJour = (jour: string): ContenuPrevu[] =>
    lignes
      .filter((l) => l.date_prevue === jour)
      .map((l) => {
        const s = sujetDe(l)
        return {
          id: l.id,
          heure: l.heure ? l.heure.slice(0, 5) : null,
          titre: s?.titre ?? 'Contenu sans titre',
          format: ((l.fiche?.format ?? s?.format) as Format | null) ?? null,
        }
      })

  // --- Série : sujet créé, fiche créée ou contenu publié (un contenu simplement prévu ne compte pas) ---
  const publiesListe = (publies.data ?? []) as unknown as { format: string | null; date_publication: string; themes: ThemeLie }[]
  const joursActifs = [
    ...(sujetsCrees.data ?? []).map((s) => jourParis(s.created_at)),
    ...(fichesCreees.data ?? []).map((f) => jourParis(f.created_at)),
    ...publiesListe.map((s) => jourParis(s.date_publication)),
  ]

  // --- Suggestions du jour ---
  const lignesSemaine = lignes.filter((l) => l.date_prevue <= dimanche)
  const publiesSemaine = publiesListe.filter((s) => jourParis(s.date_publication) >= lundi)
  const piliersDeLaSemaine = [
    ...lignesSemaine.map((l) => sujetDe(l)?.themes?.pilier),
    ...publiesSemaine.map((s) => s.themes?.pilier),
  ].map((p) => (estPilier(p) ? p : null))
  const formatsRecents = [
    ...[...lignesSemaine].reverse().map((l) => l.fiche?.format ?? sujetDe(l)?.format),
    ...publiesListe.map((s) => s.format),
  ] as (Format | null)[]

  const sujets = ((candidats.data ?? []) as unknown as {
    id: string
    titre: string
    statut: string
    format: string | null
    themes: ThemeLie
  }[])
    .filter((s) => !prevus.has(s.id))
    .map<SujetCandidat>((s) => ({
      id: s.id,
      titre: s.titre,
      statut: s.statut,
      format: (s.format as Format | null) ?? null,
      pilier: estPilier(s.themes?.pilier) ? (s.themes!.pilier as Pilier) : null,
      theme: s.themes?.nom ?? null,
      numero: numero(s.themes?.ordre),
    }))

  const donnees: DonneesAccueil = {
    nom: profil.data?.nom ?? 'Manuella',
    photo: profil.data?.photo_url ?? PHOTO_MANUELLA,
    date: dateEnToutesLettres(aujourdhui),
    salutation: salutation(heureParis()),
    phrase: PHRASES_DU_JOUR[jourDeLAnnee(aujourdhui) % PHRASES_DU_JOUR.length],
    serie: serieDeJours(joursActifs, aujourdhui),
    jourOff: offs.has(aujourdhui),
    ideesEnAttente: idees.count ?? 0,
    suggestions: classerSuggestions(sujets, { piliersDeLaSemaine, formatsRecents, jour: aujourdhui }).slice(0, 20),
    semaine: semaine.map((jour) => ({
      jour,
      numero: Number(jour.slice(8)),
      off: offs.has(jour),
      contenus: contenusDuJour(jour),
    })),
    aujourdhui,
    reseaux: (reseaux.data ?? []).map((r) => ({
      id: r.id as string,
      plateforme: r.plateforme as string,
      pseudo: r.pseudo as string,
      abonnes: r.abonnes as number,
      objectif: r.objectif as number,
    })),
  }

  return <Accueil donnees={donnees} />
}
