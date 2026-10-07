import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ajouterSujet, decider } from './actions'
import StatutSujet from '../composants/StatutSujet'

type Filtres = Promise<{ theme?: string; statut?: string }>

const LIBELLES_STATUT: Record<string, string> = {
  idee: 'Idées',
  valide: 'Validés',
  a_apprendre: 'À apprendre',
  tourne: 'Tournés',
  publie: 'Publiés',
  rejete: 'Rejetés',
}

export default function Page({ searchParams }: { searchParams: Filtres }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen max-w-md mx-auto px-6 pt-10">
          <p className="text-rose text-sm">Chargement de ta banque…</p>
        </main>
      }
    >
      <Banque searchParams={searchParams} />
    </Suspense>
  )
}

async function Banque({ searchParams }: { searchParams: Filtres }) {
  const { theme, statut } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: themes } = await supabase
    .from('themes')
    .select('id, nom')
    .order('ordre')

  let requete = supabase
    .from('sujets')
    .select('id, titre, statut, theme_id')
    .order('created_at', { ascending: false })
  if (theme) requete = requete.eq('theme_id', theme)
  requete = statut ? requete.eq('statut', statut) : requete.neq('statut', 'rejete')
  const { data: sujets } = await requete

  const nomsThemes = new Map((themes ?? []).map((t) => [t.id, t.nom]))
  const liste = sujets ?? []
  const idees = liste.filter((s) => s.statut === 'idee')
  const autres = liste.filter((s) => s.statut !== 'idee')

  // Construit le lien d'un filtre en gardant l'autre
  const lien = (cle: 'theme' | 'statut', valeur?: string) => {
    const params = new URLSearchParams()
    if (cle !== 'theme' && theme) params.set('theme', theme)
    if (cle !== 'statut' && statut) params.set('statut', statut)
    if (valeur) params.set(cle, valeur)
    const texte = params.toString()
    return texte ? `/sujets?${texte}` : '/sujets'
  }

  const pastille = (actif: boolean) =>
    `shrink-0 h-9 px-4 rounded-full text-sm flex items-center ${
      actif ? 'bg-white text-bordeaux font-medium' : 'border border-rose text-white'
    }`

  return (
    <main className="min-h-screen max-w-md mx-auto pt-7 pb-28">
      <header className="px-6">
        <p className="text-rose text-sm">
          {liste.length} sujet{liste.length > 1 ? 's' : ''}
          {theme ? ` en ${nomsThemes.get(theme) ?? ''}` : ''}
        </p>
        <h1 className="mt-1 font-titre text-white text-4xl font-semibold leading-tight">
          Ta banque de sujets
        </h1>
      </header>

      <nav aria-label="Filtrer par thème" className="mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={lien('theme')} className={pastille(!theme)}>
          Tous les thèmes
        </Link>
        {themes?.map((t) => (
          <Link key={t.id} href={lien('theme', t.id)} className={pastille(theme === t.id)}>
            {t.nom}
          </Link>
        ))}
      </nav>

      <nav aria-label="Filtrer par statut" className="mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={lien('statut')} className={pastille(!statut)}>
          En cours
        </Link>
        {Object.entries(LIBELLES_STATUT).map(([valeur, label]) => (
          <Link key={valeur} href={lien('statut', valeur)} className={pastille(statut === valeur)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 px-4 flex flex-col gap-3">
        {idees.map((sujet) => (
          <article key={sujet.id} className="bg-white rounded-3xl p-5 flex flex-col gap-3">
            <p className="text-xs text-neutral-600">
              Nouvelle idée{sujet.theme_id ? ` en ${nomsThemes.get(sujet.theme_id)}` : ''}
            </p>
            <h2 className="font-titre text-2xl font-semibold leading-tight">{sujet.titre}</h2>
            <div className="flex gap-2">
              <form action={decider} className="flex-1">
                <input type="hidden" name="id" value={sujet.id} />
                <input type="hidden" name="decision" value="valide" />
                <button type="submit" className="w-full h-11 rounded-full bg-bordeaux text-white text-sm">
                  Valider
                </button>
              </form>
              <form action={decider} className="flex-1">
                <input type="hidden" name="id" value={sujet.id} />
                <input type="hidden" name="decision" value="rejete" />
                <button
                  type="submit"
                  className="w-full h-11 rounded-full border border-encre text-encre text-sm"
                >
                  Rejeter
                </button>
              </form>
            </div>
          </article>
        ))}

        {autres.map((sujet) => (
          <article
            key={sujet.id}
            className="bg-white rounded-2xl px-4 py-3 flex justify-between items-center gap-3"
          >
            <div className="min-w-0">
              {sujet.theme_id && !theme && (
                <p className="text-xs text-neutral-600">{nomsThemes.get(sujet.theme_id)}</p>
              )}
              <h2 className="text-[15px] font-medium leading-snug">{sujet.titre}</h2>
            </div>
            <StatutSujet id={sujet.id} statut={sujet.statut} />
          </article>
        ))}

        {liste.length === 0 && (
          <p className="px-2 text-sm text-rose">
            Aucun sujet ici pour l&apos;instant. Ajoute ta propre idée juste en dessous, ou change
            de filtre.
          </p>
        )}
      </div>

      <section className="mt-6 mx-4 rounded-3xl border border-rose p-5">
        <h2 className="font-titre text-white text-2xl font-semibold">Ajouter une idée</h2>
        <form action={ajouterSujet} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm text-rose">
            Ton sujet
            <input
              name="titre"
              required
              placeholder="La jalousie entre filles"
              className="h-11 rounded-xl bg-white px-3 text-base text-encre"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-rose">
            Thème
            <select
              name="theme_id"
              defaultValue={theme ?? ''}
              className="h-11 rounded-xl bg-white px-3 text-base text-encre"
            >
              <option value="">Sans thème</option>
              {themes?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-1 h-12 rounded-full bg-white text-bordeaux text-base font-medium"
          >
            Ajouter à ma banque
          </button>
        </form>
      </section>
    </main>
  )
}
