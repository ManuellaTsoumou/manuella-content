import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

export default async function Accueil() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const { data: profil } = await supabase
    .from('profil')
    .select('nom, bio')
    .eq('id', user.id)
    .single()

  const { data: reseaux } = await supabase
    .from('reseaux')
    .select('id, plateforme, pseudo, abonnes, objectif')
    .order('plateforme')

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

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-7 pb-10">
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
        <div className="flex gap-4 items-center">
          <div
            aria-hidden="true"
            className="w-16 h-16 shrink-0 rounded-full bg-rose-pale border-2 border-bordeaux flex items-center justify-center font-titre text-3xl text-bordeaux"
          >
            {nom.charAt(0)}
          </div>
          <div>
            <p className="font-titre text-2xl font-semibold">{nom}</p>
            {profil?.bio && <p className="text-sm text-neutral-600">{profil.bio}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {reseaux?.map((reseau) => {
            const progression = Math.min(
              100,
              Math.round((reseau.abonnes / reseau.objectif) * 100)
            )
            return (
              <div key={reseau.id} className="bg-poudre rounded-2xl p-4">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-sm text-neutral-600">
                    {NOMS_RESEAUX[reseau.plateforme] ?? reseau.plateforme} {reseau.pseudo}
                  </p>
                  <p className="text-xs text-bordeaux">{progression} %</p>
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
              </div>
            )
          })}
        </div>
      </section>

      <p className="mt-6 px-2 text-sm text-rose">
        {nombreThemes
          ? `Ta base répond : ${nombreThemes} thèmes sont prêts pour ta banque de sujets.`
          : 'Ta base ne renvoie aucun thème pour l’instant. Vérifie que tu as bien lancé la dernière partie du fichier SQL.'}
      </p>
    </main>
  )
}
