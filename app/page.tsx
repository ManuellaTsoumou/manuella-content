import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { majAbonnes, ajouterReseau } from './actions'
import PhotoProfil from './composants/PhotoProfil'
import TransitionPage from './composants/animation/TransitionPage'
import Cascade, { Apparition } from './composants/animation/Cascade'
import Carte from './composants/ui/Carte'
import Compteur from './composants/ui/Compteur'
import Champ, { ListeDeroulante } from './composants/ui/Champ'
import Bouton, { BoutonEnvoi } from './composants/ui/Bouton'
import FormulaireAction from './composants/ui/FormulaireAction'
import { SkeletonPage } from './composants/ui/Skeleton'

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
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de ton espace…" />}>
        <Accueil />
      </Suspense>
    </TransitionPage>
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
    <main className="min-h-dvh max-w-md mx-auto px-5 pt-8 pb-32">
      <Cascade className="flex flex-col gap-4">
        <Apparition className="flex justify-between items-end gap-4 px-1 mb-2">
          <div>
            <p className="surtitre text-accent first-letter:uppercase">{date}</p>
            <h1 className="mt-2 font-titre text-titre-1 font-medium">
              {salutation}, <em className="text-accent">{nom}</em>
            </h1>
          </div>
          <form action={seDeconnecter}>
            <Bouton type="submit" variante="fantome" taille="petit">
              Me déconnecter
            </Bouton>
          </form>
        </Apparition>

        <Carte className="flex flex-col gap-5">
          <div className="flex gap-4 items-start">
            <PhotoProfil userId={user.id} nom={nom} photoUrl={profil?.photo_url ?? null} />
            <div className="pt-2">
              <p className="font-titre text-titre-2 font-semibold">{nom}</p>
              {profil?.bio && <p className="text-sm text-texte-doux">{profil.bio}</p>}
              <p className="mt-3 text-sm text-texte-doux">
                <Compteur valeur={total} className="text-2xl font-medium text-texte" /> abonnés sur
                tous tes réseaux
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
              const plateforme = NOMS_RESEAUX[reseau.plateforme] ?? reseau.plateforme
              return (
                <div key={reseau.id} className="bg-surface-creuse rounded-bouton p-4">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="text-sm text-texte-doux">
                      {plateforme} {reseau.pseudo}
                    </p>
                    <p className="text-xs font-medium text-accent">
                      {objectifAtteint ? 'Objectif atteint' : `${progression} %`}
                    </p>
                  </div>
                  <p className="mt-1 text-2xl font-medium">
                    <Compteur valeur={reseau.abonnes} />
                    <span className="text-sm font-normal text-texte-doux">
                      {' '}
                      / {reseau.objectif.toLocaleString('fr-FR')} abonnés
                    </span>
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-bordeaux-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent origin-left"
                      style={{ width: `${progression}%` }}
                    />
                  </div>

                  <FormulaireAction
                    action={majAbonnes}
                    messageSucces={`${plateforme} est à jour.`}
                    className="mt-4 flex gap-2 items-start"
                  >
                    <input type="hidden" name="id" value={reseau.id} />
                    <Champ
                      label={`Abonnés sur ${plateforme}`}
                      name="abonnes"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      required
                      defaultValue={reseau.abonnes}
                      className="min-w-0 flex-1"
                    />
                    <BoutonEnvoi className="h-14 shrink-0" texteChargement="Enregistrement">
                      Mettre à jour
                    </BoutonEnvoi>
                  </FormulaireAction>
                </div>
              )
            })}
          </div>
        </Carte>

        {disponibles.length > 0 && (
          <Carte ton="creuse">
            <h2 className="font-titre text-titre-2 font-semibold">Ajouter un réseau</h2>
            <p className="mt-1 text-sm text-texte-doux">
              Chaque nouveau réseau commence avec l&apos;objectif des 10 000 abonnés.
            </p>
            <FormulaireAction
              action={ajouterReseau}
              messageSucces="Nouveau réseau ajouté. On y va ensemble."
              className="mt-4 flex flex-col gap-3"
            >
              <ListeDeroulante label="Réseau" name="plateforme" required>
                {disponibles.map((p) => (
                  <option key={p} value={p}>
                    {NOMS_RESEAUX[p]}
                  </option>
                ))}
              </ListeDeroulante>
              <Champ label="Pseudo" name="pseudo" required defaultValue="@lady.manuella_" />
              <Champ
                label="Abonnés actuels"
                name="abonnes"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={0}
              />
              <BoutonEnvoi taille="grand" pleineLargeur className="mt-1" texteChargement="Ajout en cours">
                Ajouter ce réseau
              </BoutonEnvoi>
            </FormulaireAction>
          </Carte>
        )}

        <Apparition>
          <p className="px-1 text-sm text-texte-doux">
            {nombreThemes
              ? `Ta base répond : ${nombreThemes} thèmes sont prêts pour ta banque de sujets.`
              : 'Ta base ne renvoie aucun thème pour l’instant. Vérifie que tu as bien lancé la dernière partie du fichier SQL.'}
          </p>
        </Apparition>
      </Cascade>
    </main>
  )
}
