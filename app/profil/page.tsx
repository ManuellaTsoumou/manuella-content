import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PHOTO_MANUELLA } from '@/lib/marque'
import { majAbonnes, ajouterReseau, seDeconnecter } from '../actions'
import TransitionPage from '../composants/animation/TransitionPage'
import Cascade, { Apparition } from '../composants/animation/Cascade'
import PhotoProfil from '../composants/PhotoProfil'
import Avatar from '../composants/ui/Avatar'
import Couverture from '../composants/ui/Couverture'
import Carte from '../composants/ui/Carte'
import Champ, { ListeDeroulante } from '../composants/ui/Champ'
import Compteur from '../composants/ui/Compteur'
import Bouton, { BoutonEnvoi } from '../composants/ui/Bouton'
import FormulaireAction from '../composants/ui/FormulaireAction'
import RubanLeopard from '../composants/ui/RubanLeopard'
import { SkeletonPage } from '../composants/ui/Skeleton'

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

export default function Page() {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Chargement de ton profil…" />}>
        <Profil />
      </Suspense>
    </TransitionPage>
  )
}

async function Profil() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profil }, { data: reseaux }] = await Promise.all([
    supabase.from('profil').select('nom, bio, photo_url').eq('id', user.id).single(),
    supabase.from('reseaux').select('id, plateforme, pseudo, abonnes, objectif').order('abonnes', { ascending: false }),
  ])

  const nom = profil?.nom ?? 'Manuella'
  const photo = profil?.photo_url ?? PHOTO_MANUELLA
  const liste = reseaux ?? []
  const total = liste.reduce((somme, r) => somme + r.abonnes, 0)
  const disponibles = Object.keys(NOMS_RESEAUX).filter((p) => !liste.some((r) => r.plateforme === p))

  return (
    <main className="relative mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
      <Couverture aria-label="Ton profil">
        <div className="flex items-center gap-4">
          <Avatar src={photo} taille={96} priorite />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">Ton profil</p>
            <h1 className="mt-1 font-titre text-[clamp(34px,10cqi,64px)] font-normal italic leading-[0.95] tracking-[-0.02em] [overflow-wrap:break-word]">
              {nom}
            </h1>
          </div>
        </div>
        {profil?.bio && <p className="mt-4 max-w-[560px] text-[15px] text-sur-bordeaux-clair">{profil.bio}</p>}
        <p className="mt-5 text-[15px] text-sur-bordeaux">
          <b className="font-titre text-[28px] font-medium text-blanc">
            <Compteur valeur={total} />
          </b>{' '}
          abonnés sur tous tes réseaux
        </p>
        <RubanLeopard className="mt-4" />
      </Couverture>

      <Cascade className="mt-[30px] grid items-start gap-[30px] bureau:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Apparition className="flex min-w-0 flex-col gap-3">
          <h2 className="mx-0.5 mb-0.5 font-titre text-[clamp(26px,7vw,32px)] font-normal italic">Tes réseaux</h2>
          {liste.length === 0 && (
            <p className="mx-0.5 text-texte-doux">Ajoute ton premier réseau juste à côté, on vise les 10 000 ensemble.</p>
          )}
          {liste.map((reseau) => {
            const plateforme = NOMS_RESEAUX[reseau.plateforme] ?? reseau.plateforme
            const progression = Math.min(100, Math.round((reseau.abonnes / reseau.objectif) * 100))
            return (
              <Carte key={reseau.id} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-bordeaux">
                    {plateforme} <span className="font-normal text-texte-doux">{reseau.pseudo}</span>
                  </p>
                  <p className="text-xs text-texte-doux">
                    {reseau.abonnes >= reseau.objectif ? 'Objectif atteint' : `${progression} %`}
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-poudre">
                  <div className="h-full rounded-full bg-bordeaux" style={{ width: `${progression}%` }} />
                </div>
                <FormulaireAction
                  action={majAbonnes}
                  messageSucces={`${plateforme} est à jour.`}
                  className="flex items-start gap-2"
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
                  <BoutonEnvoi variante="plein" taille="moyen" className="h-[62px] shrink-0" texteChargement="…">
                    Mettre à jour
                  </BoutonEnvoi>
                </FormulaireAction>
              </Carte>
            )
          })}
        </Apparition>

        <div className="flex min-w-0 flex-col gap-[30px]">
          <Apparition className="flex flex-col gap-3">
            <h2 className="mx-0.5 mb-0.5 font-titre text-[clamp(26px,7vw,32px)] font-normal italic">Ta photo</h2>
            <Carte className="flex items-center gap-4">
              <PhotoProfil userId={user.id} nom={nom} photoUrl={photo} />
              <p className="text-sm text-texte-doux">
                Elle apparaît dans l’anneau doré de ton accueil et de ta Bibliothèque.
              </p>
            </Carte>
          </Apparition>

          {disponibles.length > 0 && (
            <Apparition className="flex flex-col gap-3">
              <h2 className="mx-0.5 mb-0.5 font-titre text-[clamp(26px,7vw,32px)] font-normal italic">Ajouter un réseau</h2>
              <Carte ton="poudre">
                <p className="relative z-[2] text-sm text-texte opacity-80">
                  Chaque nouveau réseau commence avec l’objectif des 10 000 abonnés.
                </p>
                <FormulaireAction
                  action={ajouterReseau}
                  messageSucces="Nouveau réseau ajouté. On y va ensemble."
                  celebration
                  className="relative z-[2] mt-4 flex flex-col gap-3"
                >
                  <ListeDeroulante label="Réseau" name="plateforme" required>
                    {disponibles.map((p) => (
                      <option key={p} value={p}>
                        {NOMS_RESEAUX[p]}
                      </option>
                    ))}
                  </ListeDeroulante>
                  <Champ label="Pseudo" name="pseudo" required defaultValue="@lady.manuella_" />
                  <Champ label="Abonnés actuels" name="abonnes" type="number" inputMode="numeric" min={0} defaultValue={0} />
                  <BoutonEnvoi taille="grand" reflet pleineLargeur texteChargement="Ajout en cours…">
                    Ajouter ce réseau
                  </BoutonEnvoi>
                </FormulaireAction>
              </Carte>
            </Apparition>
          )}

          <Apparition>
            <form action={seDeconnecter}>
              <Bouton type="submit" variante="contour" taille="moyen" pleineLargeur>
                Me déconnecter
              </Bouton>
            </form>
          </Apparition>
        </div>
      </Cascade>
    </main>
  )
}
