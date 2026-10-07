import { Suspense } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LIBELLES } from '@/lib/agent/fiche'
import GenerateurFiche from '@/app/composants/GenerateurFiche'
import CaseApprise from '@/app/composants/CaseApprise'
import StatutSujet from '@/app/composants/StatutSujet'

type Params = Promise<{ id: string }>

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen max-w-md mx-auto px-6 pt-10">
          <p className="text-rose text-sm">Chargement de la fiche…</p>
        </main>
      }
    >
      <FicheSujet params={params} />
    </Suspense>
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
    <main className="min-h-screen max-w-md mx-auto px-4 pt-6 pb-28 flex flex-col gap-4">
      <header className="px-2">
        <Link href="/sujets" className="text-sm text-rose underline underline-offset-2">
          Retour à ma banque
        </Link>
        {theme && <p className="mt-4 text-sm text-rose">{theme}</p>}
        <h1 className="mt-1 font-titre text-white text-4xl font-semibold leading-tight">
          {sujet.titre}
        </h1>
        <div className="mt-3">
          <StatutSujet id={sujet.id} statut={sujet.statut} />
        </div>
        {sujet.pourquoi_ca_touche && (
          <p className="mt-3 text-sm text-rose leading-relaxed">{sujet.pourquoi_ca_touche}</p>
        )}
      </header>

      {apprentissages && apprentissages.length > 0 && (
        <section className="bg-encre rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-baseline gap-3">
            <h2 className="font-titre text-white text-2xl font-semibold">À apprendre avant de tourner</h2>
            <p className="text-sm text-rose shrink-0">
              {nbAppris} sur {apprentissages.length}
            </p>
          </div>
          {apprentissages.map((a) => {
            const sources = (a.sources ?? []) as { titre: string; url: string }[]
            return (
              <div key={a.id} className="flex flex-col gap-2 border-t border-neutral-700 pt-4">
                <CaseApprise id={a.id} appris={a.appris} notion={a.notion} />
                {a.resume && <p className="text-sm text-neutral-300 leading-relaxed">{a.resume}</p>}
                {a.a_verifier && (
                  <p className="text-sm text-rose leading-relaxed">À vérifier : {a.a_verifier}</p>
                )}
                {sources.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-white underline underline-offset-2 break-words"
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
        </section>
      )}

      {fiches?.map((f) => (
        <article key={f.id} className="bg-white rounded-3xl p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-600">
            {LIBELLES.format[f.format as keyof typeof LIBELLES.format]?.split(' (')[0]},{' '}
            {f.decor ? LIBELLES.decor[f.decor as keyof typeof LIBELLES.decor] : ''},{' '}
            {f.mode ? LIBELLES.mode[f.mode as keyof typeof LIBELLES.mode] : ''}
          </p>
          {f.hook && (
            <p className="font-titre text-2xl italic leading-snug">« {f.hook} »</p>
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
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-neutral-700">
                {f.description}
              </p>
            </div>
          )}
          {f.hashtags && f.hashtags.length > 0 && (
            <p className="text-sm text-bordeaux">{f.hashtags.map((h: string) => `#${h}`).join(' ')}</p>
          )}
        </article>
      ))}

      <GenerateurFiche sujetId={sujet.id} />

      {connexes.length > 0 && (
        <section className="px-2">
          <h2 className="font-titre text-white text-2xl font-semibold">Pour continuer</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {connexes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/sujets/${c.id}`}
                  className="block rounded-2xl border border-rose px-4 py-3 text-white text-sm"
                >
                  {c.titre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
