import { Suspense } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LIBELLES } from '@/lib/agent/fiche'
import { ART, NOMS_PILIERS, estPilier, nomFormat, numero } from '@/lib/contenu'
import GenerateurFiche from '@/app/composants/GenerateurFiche'
import CaseApprise from '@/app/composants/CaseApprise'
import StatutSujet from '@/app/composants/StatutSujet'
import TransitionPage from '@/app/composants/animation/TransitionPage'
import Cascade, { Apparition } from '@/app/composants/animation/Cascade'
import BoutonCopier from '@/app/composants/ui/BoutonCopier'
import Carte, { NumeroFiligrane } from '@/app/composants/ui/Carte'
import { SkeletonPage } from '@/app/composants/ui/Skeleton'

type Params = Promise<{ id: string }>
type Theme = { id: string; nom: string; ordre: number | null; pilier: string | null } | null

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
    .select('id, titre, statut, format, angle, pourquoi_ca_touche, themes(id, nom, ordre, pilier)')
    .eq('id', id)
    .single()
  if (!sujet) notFound()

  const [{ data: fiches }, { data: apprentissages }, { data: liens }] = await Promise.all([
    supabase
      .from('fiches')
      .select('id, format, decor, mode, hook, script, description, hashtags')
      .eq('sujet_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('apprentissages').select('id, notion, resume, a_verifier, sources, appris').eq('sujet_id', id),
    supabase.from('sujets_connexes').select('connexe:connexe_id(id, titre)').eq('sujet_id', id),
  ])

  const theme = sujet.themes as unknown as Theme
  const pilier = estPilier(theme?.pilier) ? theme.pilier : 'soin'
  const connexes = (liens ?? [])
    .map((l) => l.connexe as unknown as { id: string; titre: string } | null)
    .filter((c): c is { id: string; titre: string } => c !== null)
  const nbAppris = (apprentissages ?? []).filter((a) => a.appris).length
  const format = nomFormat(sujet.format)

  return (
    <main className={`grain relative min-h-dvh ${ART[pilier]}`}>
      <div className="sticky top-0 z-[5] px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-2.5">
        <Link
          href={theme ? `/sujets?theme=${theme.id}` : '/sujets'}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-(--chip) pr-[18px] pl-3.5 text-sm font-medium text-current no-underline backdrop-blur-[10px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m11 6-6 6 6 6" />
          </svg>
          {theme ? theme.nom : 'Bibliothèque'}
        </Link>
      </div>

      <Cascade className="relative z-[2] mx-auto flex min-h-[42vh] max-w-[760px] flex-col justify-end gap-4 overflow-hidden px-[clamp(18px,5vw,40px)] pt-5 pb-[34px]">
        <NumeroFiligrane numero={numero(theme?.ordre)} className="-top-10 -right-2.5 text-[min(70vw,420px)]" />
        <Apparition>
          <p className="relative surtitre text-xs tracking-[0.12em] text-(--sub)">
            {NOMS_PILIERS[pilier]}
            {theme ? ` · ${theme.nom}` : ''}
          </p>
        </Apparition>
        <Apparition>
          <h1 className="relative font-titre text-[clamp(36px,10vw,80px)] font-normal italic leading-[0.98] tracking-[-0.02em] [overflow-wrap:break-word]">
            {sujet.titre}
          </h1>
        </Apparition>
        {sujet.pourquoi_ca_touche && (
          <Apparition>
            <p className="relative max-w-[560px] font-titre text-[clamp(18px,4.8vw,22px)] italic leading-[1.35] text-(--sub)">
              {sujet.pourquoi_ca_touche}
            </p>
          </Apparition>
        )}
        <Apparition className="relative flex flex-wrap items-center gap-2">
          <StatutSujet id={sujet.id} statut={sujet.statut} surPilier />
          {format && <span className="rounded-full bg-(--chip) px-3.5 py-2.5 text-sm">{format}</span>}
          {(fiches?.length ?? 0) > 0 && (
            <span className="rounded-full bg-(--chip) px-3.5 py-2.5 text-sm">
              {fiches!.length} fiche{fiches!.length > 1 ? 's' : ''}
            </span>
          )}
        </Apparition>
      </Cascade>

      <div className="relative z-[3] min-h-[60vh] rounded-t-[32px] bg-fond px-[clamp(14px,4vw,32px)] pt-[26px] pb-[140px] text-texte">
        <Cascade className="mx-auto flex max-w-[760px] flex-col gap-[30px]">
          {apprentissages && apprentissages.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <TeteSection titre="À apprendre avant de tourner">
                {nbAppris} sur {apprentissages.length}
              </TeteSection>
              <Carte ton="mental" className="flex flex-col gap-4 p-5">
                {apprentissages.map((a, i) => {
                  const sources = (a.sources ?? []) as { titre: string; url: string }[]
                  return (
                    <div key={a.id} className={`relative z-[2] flex flex-col gap-2 ${i ? 'border-t border-creme/15 pt-4' : ''}`}>
                      <CaseApprise id={a.id} appris={a.appris} notion={a.notion} />
                      {a.resume && <p className="text-sm leading-relaxed text-creme/80">{a.resume}</p>}
                      {a.a_verifier && (
                        <p className="text-sm leading-relaxed text-or">
                          <b className="font-semibold">À vérifier :</b> {a.a_verifier}
                        </p>
                      )}
                      {sources.length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {sources.map((s) => (
                            <li key={s.url}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm break-words text-creme underline decoration-creme/40 underline-offset-2 hover:decoration-creme"
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
            </section>
          )}

          {fiches && fiches.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <TeteSection titre={fiches.length > 1 ? 'Tes fiches' : 'Ta fiche'}>prêtes à tourner</TeteSection>
              {fiches.map((f) => (
                <Carte key={f.id} className="flex flex-col gap-4 p-5 carte:p-6">
                  <p className="surtitre text-bordeaux">
                    {LIBELLES.format[f.format as keyof typeof LIBELLES.format]?.split(' (')[0]}
                    {f.decor ? ` · ${LIBELLES.decor[f.decor as keyof typeof LIBELLES.decor]}` : ''}
                    {f.mode ? ` · ${LIBELLES.mode[f.mode as keyof typeof LIBELLES.mode]}` : ''}
                  </p>
                  {f.hook && (
                    <div className="flex items-start gap-3">
                      <span aria-hidden="true" className="flex-none font-titre text-[54px] leading-[0.7] text-or-profond">
                        “
                      </span>
                      <p className="font-titre text-[clamp(22px,6vw,28px)] italic leading-[1.2] text-bordeaux">{f.hook}</p>
                    </div>
                  )}
                  {f.script && (
                    <div>
                      <h3 className="surtitre text-texte-doux">Script</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line">{f.script}</p>
                    </div>
                  )}
                  {f.description && (
                    <div>
                      <h3 className="surtitre text-texte-doux">Description</h3>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-texte-doux">{f.description}</p>
                    </div>
                  )}
                  {f.hashtags && f.hashtags.length > 0 && (
                    <p className="text-sm text-bordeaux">{f.hashtags.map((h: string) => `#${h}`).join(' ')}</p>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-ligne pt-4">
                    {f.hook && <BoutonCopier texte={f.hook} libelle="Copier le hook" message="Hook copié" />}
                    {f.script && <BoutonCopier texte={f.script} libelle="Copier le script" message="Script copié" />}
                    {(f.description || f.hashtags?.length) && (
                      <BoutonCopier
                        texte={[f.description, (f.hashtags ?? []).map((h: string) => `#${h}`).join(' ')].filter(Boolean).join('\n\n')}
                        libelle="Copier la description"
                        message="Description et hashtags copiés"
                      />
                    )}
                  </div>
                </Carte>
              ))}
            </section>
          )}

          <Apparition>
            <GenerateurFiche sujetId={sujet.id} formatInitial={sujet.format} />
          </Apparition>

          {connexes.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <TeteSection titre="Pour continuer">idées suivantes</TeteSection>
              <Apparition className="grid gap-2.5 carte:grid-cols-2">
                {connexes.map((c) => (
                  <Link
                    key={c.id}
                    href={`/sujets/${c.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-[18px] border border-ligne bg-surface px-4 py-3 font-titre text-lg text-texte no-underline transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-bordeaux"
                  >
                    {c.titre}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-bordeaux">
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                  </Link>
                ))}
              </Apparition>
            </section>
          )}
        </Cascade>
      </div>
    </main>
  )
}

function TeteSection({ titre, children }: { titre: string; children?: React.ReactNode }) {
  return (
    <Apparition className="mx-1 flex items-baseline justify-between gap-3">
      <h2 className="font-titre text-[clamp(26px,7vw,32px)] font-normal italic">{titre}</h2>
      {children && <span className="text-[13px] text-texte-doux">{children}</span>}
    </Apparition>
  )
}
