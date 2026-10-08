import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { heureParis, jourParis, salutation } from '@/lib/dates'
import { estPilier, numero, type Format } from '@/lib/contenu'
import { PHOTO_MANUELLA } from '@/lib/marque'
import TransitionPage from '../composants/animation/TransitionPage'
import { SkeletonPage } from '../composants/ui/Skeleton'
import Bibliotheque, {
  CLE_INTRO,
  type DonneesBibliotheque,
  type SujetBiblio,
  type ThemeBiblio,
} from '../composants/bibliotheque/Bibliotheque'

// Tailles des tuiles de la grille bento, dans l'ordre des thèmes (repris de la maquette)
const TAILLES: ThemeBiblio['taille'][] = ['big', 'small', 'tall', 'small', 'wide', 'tall', 'small', 'small', 'wide', 'small', 'small']

// Posé avant l'affichage : si l'intro a déjà été vue pendant cette session, elle ne clignote pas
const SCRIPT_INTRO = `try{if(sessionStorage.getItem('${CLE_INTRO}'))document.documentElement.dataset.introVue='1'}catch(e){}`

export default function Page() {
  return (
    <TransitionPage>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_INTRO }} />
      <Suspense fallback={<SkeletonPage texte="Chargement de ta Bibliothèque…" cartes={4} />}>
        <DonneesBibliotheque />
      </Suspense>
    </TransitionPage>
  )
}

type LignePlanning = { sujet_id: string | null; fiche: { sujet_id: string } | null }

async function DonneesBibliotheque() {
  // La salutation et le planning dépendent de l'heure de Paris : rien ici n'est pré-calculé
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [profil, themes, sujets, planning] = await Promise.all([
    supabase.from('profil').select('nom, photo_url').eq('id', user.id).single(),
    supabase.from('themes').select('id, nom, ordre, pilier').order('ordre'),
    supabase
      .from('sujets')
      .select('id, titre, statut, format, theme_id')
      .neq('statut', 'rejete')
      .order('created_at', { ascending: true }),
    supabase.from('calendrier').select('sujet_id, fiche:fiche_id(sujet_id)').gte('date_prevue', jourParis()),
  ])

  const planifies = new Set(
    ((planning.data ?? []) as unknown as LignePlanning[]).map((l) => l.sujet_id ?? l.fiche?.sujet_id).filter(Boolean)
  )

  const donnees: DonneesBibliotheque = {
    nom: profil.data?.nom ?? 'Manuella',
    photo: profil.data?.photo_url ?? PHOTO_MANUELLA,
    salutation: salutation(heureParis()).replace(',', ''),
    themes: (themes.data ?? []).map<ThemeBiblio>((t, i) => ({
      id: t.id,
      nom: t.nom,
      numero: numero(t.ordre ?? i + 1),
      pilier: estPilier(t.pilier) ? t.pilier : 'soin',
      taille: TAILLES[i % TAILLES.length],
    })),
    sujets: (sujets.data ?? []).map<SujetBiblio>((s) => ({
      id: s.id,
      titre: s.titre,
      statut: s.statut,
      format: (s.format as Format | null) ?? null,
      themeId: s.theme_id,
      planifie: planifies.has(s.id),
    })),
  }

  return <Bibliotheque donnees={donnees} />
}
