import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { majAbonnes, ajouterReseau } from './actions'
import PhotoProfil from './composants/PhotoProfil'

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

// Next.js 16 (Cache Components) : les données personnelles se chargent
// dans un bloc Suspense, avec un écran d'attente pendant le chargement.
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen max-w-md mx-auto px-6 pt-10">
          <p className="text-rose text-sm">Chargement de ton espace…</p>
        </main>
      }
    >
      <Accueil />
    </Suspense>
  )
}

async function Accueil() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profil } = await supabase
    .from('profil')
    .select('nom, bio, photo_url')
    .eq('id', user.id)
    .single()

  const { data: reseaux } = await supabase
    .from('reseaux')
    .select('id, plateforme, pseudo, abonnes, objectif')
    .order('abonnes', { ascending: false })

  const { count: nombreThemes } = await supabase
    .from('themes')
    .select('*', { count: 'exact', head: true })

  async function seDeconnecter() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/connexion')
  }

  const maintenant = new Date()
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(maintenant)
  const heure = Number(
    new Intl.DateTimeFormat('fr-FR', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Paris',
    }).format(maintenant)
  )
  const salutation = heure >= 18 || heure < 5 ? 'Bonsoir' : 'Bonjour'
  const nom = profil?.nom ?? 'Manuella'

  const listeReseaux = reseaux ?? []
  const total = listeReseaux.reduce((somme, r) => somme + r.abonnes, 0)
  const disponibles = Object.keys(NOMS_RESEAUX).filter(
    (p) => !listeReseaux.some((r) => r.plateforme === p)
  )

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-7 pb-12">
      <header className="px-2 flex justify-between items-end gap-4">
        <div>
          <p className="text-rose text-sm first-letter:uppercase">{date}</p>
          <h1 className="mt-1 font-titre text-white text-4xl font-semibold leading-tight">
            {salutation}, {nom}
          </h1>
        </div>
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="h-11 px-4 rounded-full border border-rose text-white text-sm"
          >
            Me déconnecter
          </button>
        </form>
      </header>

      <section className="mt-6 bg-white rounded-3xl p-5 flex flex-col gap-5">
        <div className="flex gap-4 items-start">
          <PhotoProfil userId={user.id} nom={nom} photoUrl={profil?.photo_url ?? null} />
          <div className="pt-2">
            <p className="font-titre text-2xl font-semibold">{nom}</p>
            {profil?.bio && <p className="text-sm text-neutral-600">{profil.bio}</p>}
            <p className="mt-3 text-sm text-neutral-600">
              <span className="text-2xl font-medium text-encre">
                {total.toLocaleString('fr-FR')}
              </span>{' '}
              abonnés sur tous tes réseaux
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {listeReseaux.map((reseau) => {
            const progression = Math.min(
              100,
              Math.round((reseau.abonnes / reseau.objectif) * 100)
            )
            const objectifAtteint = reseau.abonnes >= reseau.objectif
            return (
              <div key={reseau.id} className="bg-poudre rounded-2xl p-4">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-sm text-neutral-600">
                    {NOMS_RESEAUX[reseau.plateforme] ?? reseau.plateforme} {reseau.pseudo}
                  </p>
                  <p className="text-xs text-bordeaux">
                    {objectifAtteint ? 'Objectif atteint' : `${progression} %`}
                  </p>
                </div>
                <p className="mt-1 text-2xl font-medium">
                  {reseau.abonnes.toLocaleString('fr-FR')}
                  <span className="text-sm font-normal text-neutral-600">
                    {' '}
                    / {reseau.objectif.toLocaleString('fr-FR')} abonnés
                  </span>
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-rose-pale">
                  <div
                    className="h-1.5 rounded-full bg-bordeaux"
                    style={{ width: `${progression}%` }}
                  />
                </div>

                <form action={majAbonnes} className="mt-4 flex gap-2">
                  <input type="hidden" name="id" value={reseau.id} />
                  <label className="sr-only" htmlFor={`abonnes-${reseau.id}`}>
                    Nouveau nombre d&apos;abonnés sur{' '}
                    {NOMS_RESEAUX[reseau.plateforme] ?? reseau.plateforme}
                  </label>
                  <input
                    id={`abonnes-${reseau.id}`}
                    name="abonnes"
                    type="number"
                    min={0}
                    required
                    defaultValue={reseau.abonnes}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-3 text-base focus:border-bordeaux focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-full bg-bordeaux text-white text-sm shrink-0"
                  >
                    Mettre à jour
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </section>

      {disponibles.length > 0 && (
        <section className="mt-4 rounded-3xl border border-rose p-5">
          <h2 className="font-titre text-white text-2xl font-semibold">Ajouter un réseau</h2>
          <p className="mt-1 text-sm text-rose">
            Chaque nouveau réseau commence avec l&apos;objectif des 10 000 abonnés.
          </p>
          <form action={ajouterReseau} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm text-rose">
              Réseau
              <select
                name="plateforme"
                required
                className="h-11 rounded-xl bg-white px-3 text-base text-encre"
              >
                {disponibles.map((p) => (
                  <option key={p} value={p}>
                    {NOMS_RESEAUX[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-rose">
              Pseudo
              <input
                name="pseudo"
                required
                defaultValue="@lady.manuella_"
                className="h-11 rounded-xl bg-white px-3 text-base text-encre"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-rose">
              Abonnés actuels
              <input
                name="abonnes"
                type="number"
                min={0}
                defaultValue={0}
                className="h-11 rounded-xl bg-white px-3 text-base text-encre"
              />
            </label>
            <button
              type="submit"
              className="mt-1 h-12 rounded-full bg-white text-bordeaux text-base font-medium"
            >
              Ajouter ce réseau
            </button>
          </form>
        </section>
      )}

      <p className="mt-6 px-2 text-sm text-rose">
        {nombreThemes
          ? `Ta base répond : ${nombreThemes} thèmes sont prêts pour ta banque de sujets.`
          : 'Ta base ne renvoie aucun thème pour l’instant. Vérifie que tu as bien lancé la dernière partie du fichier SQL.'}
      </p>
    </main>
  )
}
