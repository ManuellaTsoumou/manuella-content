import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LIBELLES } from '@/lib/agent/fiche'
import { ART, estPilier } from '@/lib/contenu'
import TransitionPage from '../composants/animation/TransitionPage'
import Cascade, { Apparition } from '../composants/animation/Cascade'
import Couverture from '../composants/ui/Couverture'
import EtatVide from '../composants/ui/EtatVide'
import RubanLeopard from '../composants/ui/RubanLeopard'
import { SkeletonPage } from '../composants/ui/Skeleton'

export default function Page() {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de tes scripts…" />}>
        <ChoixDuScript />
      </Suspense>
    </TransitionPage>
  )
}

type FicheListe = {
  id: string
  format: string | null
  hook: string | null
  script: string
  sujet: { titre: string; themes: { pilier: string | null } | null } | null
}

// Durée de lecture estimée : environ 150 mots par minute à l'oral
function duree(script: string) {
  const secondes = Math.max(15, Math.round((script.split(/\s+/).length / 150) * 60))
  return secondes < 60 ? `${secondes} s` : `${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, '0')}`
}

async function ChoixDuScript() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('fiches')
    .select('id, format, hook, script, sujet:sujet_id(titre, themes(pilier))')
    .not('script', 'is', null)
    .order('created_at', { ascending: false })
    .limit(30)
  const fiches = (data ?? []) as unknown as FicheListe[]

  return (
    <main className="relative mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
      <Couverture aria-label="Téléprompteur">
        <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">Prête à tourner</p>
        <h1 className="mt-3 font-titre text-[clamp(38px,12cqi,96px)] font-medium leading-[0.92] tracking-[-0.025em]">
          Ton <em className="block font-normal italic">téléprompteur</em>
        </h1>
        <p className="mt-3.5 max-w-[520px] text-[15px] text-sur-bordeaux">
          Choisis un script : il défilera en grand pendant que tu filmes. Pose ton téléphone près de l’objectif, et parle.
        </p>
        <RubanLeopard className="mt-4" />
      </Couverture>

      {fiches.length === 0 ? (
        <EtatVide
          titre="Aucun script pour l’instant"
          texte="Génère une fiche depuis un sujet de ta Bibliothèque : son script t’attendra ici."
        >
          <Link href="/sujets" className="inline-flex min-h-11 items-center font-medium">
            Ouvrir ma Bibliothèque
          </Link>
        </EtatVide>
      ) : (
        <Cascade className="mt-[30px] grid gap-3 carte:grid-cols-2 bureau:grid-cols-3">
          {fiches.map((f) => {
            const pilier = estPilier(f.sujet?.themes?.pilier) ? f.sujet!.themes!.pilier! : 'soin'
            return (
              <Apparition key={f.id}>
                <Link
                  href={`/teleprompteur/${f.id}`}
                  className={`grain group relative flex h-full min-h-[170px] flex-col justify-between gap-4 overflow-hidden rounded-carte p-5 no-underline transition-transform duration-200 hover:-translate-y-[3px] active:scale-[0.98] ${ART[pilier as keyof typeof ART]}`}
                >
                  <div className="relative z-[2]">
                    <p className="surtitre text-(--sub)">
                      {LIBELLES.format[f.format as keyof typeof LIBELLES.format]?.split(' (')[0] ?? 'Script'} · {duree(f.script)}
                    </p>
                    <h2 className="mt-1.5 font-titre text-[clamp(21px,5.6vw,25px)] font-medium leading-[1.12]">
                      {f.sujet?.titre ?? 'Sujet sans titre'}
                    </h2>
                    {f.hook && <p className="mt-2 line-clamp-2 font-titre text-[15px] italic text-(--sub)">« {f.hook} »</p>}
                  </div>
                  <span className="relative z-[2] inline-flex items-center gap-2 self-start rounded-full bg-(--chip) px-3.5 py-2 text-sm font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
                    </svg>
                    Lire en filmant
                  </span>
                </Link>
              </Apparition>
            )
          })}
        </Cascade>
      )}
    </main>
  )
}
