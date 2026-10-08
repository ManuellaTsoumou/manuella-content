import { Suspense } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LIBELLES } from '@/lib/agent/fiche'
import GenerateurFiche from '@/app/composants/GenerateurFiche'
import CaseApprise from '@/app/composants/CaseApprise'
import StatutSujet from '@/app/composants/StatutSujet'
import TransitionPage from '@/app/composants/animation/TransitionPage'
import Cascade, { Apparition } from '@/app/composants/animation/Cascade'
import Carte from '@/app/composants/ui/Carte'
import { SkeletonPage } from '@/app/composants/ui/Skeleton'

type Params = Promise<{ id: string }>

export default function Page({ params }: { params: Params }) {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de la fiche…" />}>
        <FicheSujet params={params} />
      </Suspense>
    </TransitionPage>
  )
}

async function FicheSujet({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: sujet } = await supabase
    .from('sujets')
    .select('id, titre, statut, angle, pourquoi_ca_touche, themes(nom)')
    .eq('id', id)
    .single()
  if (!sujet) notFound()

  const theme = (sujet.themes as unknown as { nom: string } | null)?.nom

  const { data: fiches } = await supabase
    .from('fiches')
    .select('id, format, decor, mode, hook, script, description, hashtags')
    .eq('sujet_id', id)
    .order('created_at', { ascending: false })

  const { data: apprentissages } = await supabase
    .from('apprentissages')
    .select('id, notion, resume, a_verifier, sources, appris')
    .eq('sujet_id', id)

  const { data: liens } = await supabase
    .from('sujets_connexes')
    .select('connexe:connexe_id(id, titre)')
    .eq('sujet_id', id)
  const connexes = (liens ?? [])
    .map((l) => l.connexe as unknown as { id: string; titre: string } | null)
    .filter((c): c is { id: string; titre: string } => c !== null)

  const nbAppris = (apprentissages ?? []).filter((a) => a.appris).length

  return (
    <main className="min-h-dvh max-w-md mx-auto px-5 pt-6 pb-32">
      <Cascade className="flex flex-col gap-4">
        <Apparition className="px-1">
          <Link
            href="/sujets"
            className="inline-flex items-center gap-1.5 h-9 text-sm text-texte-doux hover:text-bordeaux transition-colors"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Retour à ma banque
          </Link>
          {theme && <p className="mt-4 surtitre text-bordeaux">{theme}</p>}
          <h1 className="mt-2 font-titre text-titre-1 font-medium">{sujet.titre}</h1>
          <div className="mt-3">
            <StatutSujet id={sujet.id} statut={sujet.statut} />
          </div>
          {sujet.pourquoi_ca_touche && (
            <p className="mt-4 font-titre italic text-xl text-texte-doux leading-snug">
              {sujet.pourquoi_ca_touche}
            </p>
          )}
        </Apparition>

        {apprentissages && apprentissages.length > 0 && (
          <Carte ton="mental" className="flex flex-col gap-4">
            <div className="flex justify-between items-baseline gap-3">
              <h2 className="font-titre text-titre-2 font-semibold">À apprendre avant de tourner</h2>
              <p className="text-sm text-sur-bordeaux shrink-0">
                {nbAppris} sur {apprentissages.length}
              </p>
            </div>
            {apprentissages.map((a) => {
              const sources = (a.sources ?? []) as { titre: string; url: string }[]
              return (
                <div key={a.id} className="flex flex-col gap-2 border-t border-blanc/15 pt-4">
                  <CaseApprise id={a.id} appris={a.appris} notion={a.notion} />
                  {a.resume && <p className="text-sm text-blanc/75 leading-relaxed">{a.resume}</p>}
                  {a.a_verifier && (
                    <p className="text-sm text-sur-bordeaux leading-relaxed">À vérifier : {a.a_verifier}</p>
                  )}
                  {sources.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blanc underline underline-offset-2 decoration-blanc/40 hover:decoration-blanc break-words"
                          >
                            {s.titre || s.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </Carte>
        )}

        {fiches?.map((f) => (
          <Carte key={f.id} className="flex flex-col gap-3">
            <p className="surtitre text-texte-doux">
              {LIBELLES.format[f.format as keyof typeof LIBELLES.format]?.split(' (')[0]}
              {f.decor ? ` · ${LIBELLES.decor[f.decor as keyof typeof LIBELLES.decor]}` : ''}
              {f.mode ? ` · ${LIBELLES.mode[f.mode as keyof typeof LIBELLES.mode]}` : ''}
            </p>
            {f.hook && (
              <p className="font-titre text-titre-2 italic text-bordeaux">« {f.hook} »</p>
            )}
            {f.script && (
              <div>
                <h3 className="text-sm font-medium text-bordeaux">Script</h3>
                <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line">{f.script}</p>
              </div>
            )}
            {f.description && (
              <div>
                <h3 className="text-sm font-medium text-bordeaux">Description</h3>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-texte-doux">
                  {f.description}
                </p>
              </div>
            )}
            {f.hashtags && f.hashtags.length > 0 && (
              <p className="text-sm text-bordeaux">{f.hashtags.map((h: string) => `#${h}`).join(' ')}</p>
            )}
          </Carte>
        ))}

        <Apparition>
          <GenerateurFiche sujetId={sujet.id} />
        </Apparition>

        {connexes.length > 0 && (
          <Apparition className="px-1">
            <h2 className="font-titre text-titre-2 font-semibold">Pour continuer</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {connexes.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/sujets/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-bouton bg-surface border border-ligne px-4 py-3 text-sm hover:border-bordeaux hover:text-bordeaux transition-colors"
                  >
                    {c.titre}
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </Apparition>
        )}
      </Cascade>
    </main>
  )
}
