'use client'

import { useRef, useState } from 'react'
import Cascade, { Apparition } from '../composants/animation/Cascade'
import Avatar from '../composants/ui/Avatar'
import Bouton, { Etincelle } from '../composants/ui/Bouton'
import Carte, { NOMS_PILIERS, NumeroFiligrane, type Pilier } from '../composants/ui/Carte'
import Case from '../composants/ui/Case'
import Champ, { ListeDeroulante } from '../composants/ui/Champ'
import Compteur from '../composants/ui/Compteur'
import Couverture from '../composants/ui/Couverture'
import EtatVide from '../composants/ui/EtatVide'
import Lettres from '../composants/ui/Lettres'
import RubanLeopard from '../composants/ui/RubanLeopard'
import { Skeleton, SkeletonCarte } from '../composants/ui/Skeleton'
import { useToast } from '../composants/ui/Toast'
import { gerbe } from '@/lib/confettis'

// Page de démonstration du design system (sera retirée à la fin de la refonte)
export default function Vitrine() {
  const toast = useToast()
  const [coche, setCoche] = useState(true)
  const [chargement, setChargement] = useState(false)
  const [abonnes, setAbonnes] = useState(4130)
  const [cle, setCle] = useState(0)
  const [repos, setRepos] = useState(false)
  const boutonConfettis = useRef<HTMLButtonElement>(null)

  return (
    <main className="relative mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
      <Couverture key={cle} repos={repos} aria-label="Couverture de démonstration">
        <div className="flex items-center gap-3">
          <Avatar />
          <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">Design system</p>
        </div>
        <p className="mt-[34px] text-sm uppercase tracking-[0.3em] text-sur-bordeaux">Bonsoir,</p>
        <h1 className="mt-1 whitespace-nowrap font-titre text-[clamp(40px,16cqi,104px)] font-normal italic leading-[0.95] tracking-[-0.02em]">
          <Lettres texte="Manuella" delai={0.2} ecart={0.045} duree={0.8} />
        </h1>
        <div className="mt-5 flex max-w-[560px] items-start gap-3">
          <span aria-hidden="true" className="flex-none font-titre text-[54px] leading-[0.7] text-or">
            “
          </span>
          <p className="font-titre text-[clamp(19px,5.2vw,24px)] italic leading-[1.3] text-citation">
            Tu n’as pas besoin d’être parfaite pour inspirer. Tu as juste besoin d’être vraie.
          </p>
        </div>
        <RubanLeopard className="mt-4" />
        <div className="mt-[22px] flex flex-wrap gap-2.5">
          <Bouton variante="clair" taille="petit" onClick={() => setCle((k) => k + 1)}>
            Rejouer
          </Bouton>
          <Bouton variante="clair" taille="petit" onClick={() => setRepos((r) => !r)}>
            {repos ? 'Couverture normale' : 'Couverture jour off'}
          </Bouton>
        </div>
      </Couverture>

      <Cascade key={`c${cle}`} className="mt-[30px] flex flex-col gap-[30px]">
        <Section titre="Couleurs">
          <div className="grid grid-cols-4 gap-2 tablette:grid-cols-7">
            {[
              ['bg-fond', 'Ivoire'],
              ['bg-surface', 'Blanc'],
              ['bg-encre', 'Encre'],
              ['bg-texte-doux', 'Texte doux'],
              ['bg-ligne', 'Lignes'],
              ['bg-bordeaux', 'Bordeaux'],
              ['bg-bordeaux-clair', 'Bordeaux clair'],
              ['bg-bordeaux-sombre', 'Bordeaux sombre'],
              ['bg-bordeaux-profond', 'Bordeaux profond'],
              ['bg-rose-poudre', 'Rose poudré'],
              ['bg-or', 'Or'],
              ['bg-or-profond', 'Or profond'],
              ['bg-creme', 'Crème'],
              ['bg-erreur', 'Erreur'],
            ].map(([classe, nom]) => (
              <div key={classe} className="flex flex-col gap-1">
                <div className={`aspect-square rounded-petit border border-ligne ${classe}`} />
                <span className="text-[11px] text-texte-doux">{nom}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section titre="Typographie">
          <p className="font-titre text-titre-1 italic">Ravie de te revoir</p>
          <p className="font-titre text-titre-2 italic">Ta suggestion du jour</p>
          <p className="font-titre text-titre-3 font-medium">Oser se montrer sans filtre</p>
          <p className="text-[15px] text-texte-doux">Jost pour l’interface : claire, ronde, élégante.</p>
          <p className="surtitre text-bordeaux">Soin de soi · Beauté</p>
        </Section>

        <Section titre="Boutons">
          <Bouton taille="grand" reflet pleineLargeur iconeFin={<Etincelle />} className="max-w-[420px]">
            C’est parti pour du nouveau contenu
          </Bouton>
          <div className="flex flex-wrap gap-2">
            <Bouton variante="plein">Je le prends</Bouton>
            <Bouton variante="contour">Pas aujourd’hui</Bouton>
            <Bouton variante="or">Je le prends</Bouton>
            <Bouton variante="nuit" icone={<Etincelle />}>
              Proposer avec l’IA
            </Bouton>
            <Bouton
              chargement={chargement}
              texteChargement="On y va…"
              onClick={() => {
                setChargement(true)
                setTimeout(() => setChargement(false), 2000)
              }}
            >
              Tester le chargement
            </Bouton>
          </div>
        </Section>

        <Section titre="Champs">
          <div className="flex max-w-[420px] flex-col gap-3.5">
            <Champ label="Adresse e-mail" type="email" />
            <Champ label="Mot de passe" type="password" />
            <Champ
              label="Adresse e-mail"
              defaultValue="manuella@"
              erreur="Oups, cette adresse e-mail ne semble pas complète. On réessaie ?"
            />
            <ListeDeroulante label="Pilier" defaultValue="soin">
              <option value="soin">Soin de soi</option>
              <option value="mental">Me construire</option>
              <option value="evoluer">Évoluer</option>
            </ListeDeroulante>
            <Case coche={coche} onChange={() => setCoche((c) => !c)}>
              <span className="text-texte-doux">Une case à cocher animée</span>
            </Case>
          </div>
        </Section>

        <Section titre="Cartes des piliers">
          <div className="grid grid-cols-1 gap-3 carte:grid-cols-3">
            {(['soin', 'mental', 'evoluer'] as Pilier[]).map((p, i) => (
              <Carte key={p} ton={p} interactive className="flex min-h-[250px] flex-col justify-between gap-4 p-5">
                <NumeroFiligrane numero={`0${i + 1}`} className="-right-1.5 -bottom-[34px] text-[150px]" />
                <div className="relative z-[2]">
                  <p className="surtitre text-(--sub)">{NOMS_PILIERS[p]} · Confiance</p>
                  <h3 className="mt-1.5 font-titre text-[clamp(23px,6.4vw,27px)] font-medium leading-[1.1]">
                    Oser se montrer sans filtre
                  </h3>
                </div>
                <div className="relative z-[2] flex gap-2">
                  <span className="rounded-full bg-(--chip) px-[11px] py-1.5 text-xs">Talk</span>
                </div>
              </Carte>
            ))}
          </div>
          <Carte ton="poudre" className="px-6 py-7">
            <h3 className="relative z-[2] font-titre text-[clamp(28px,8vw,40px)] italic leading-[1.05]">
              Aujourd’hui, tu te reposes.
            </h3>
            <p className="relative z-[2] mt-3 text-texte opacity-80">C’est aussi ça, prendre soin de toi.</p>
          </Carte>
        </Section>

        <Section titre="Toasts et confettis">
          <div className="flex flex-wrap gap-2">
            <Bouton variante="contour" onClick={() => toast('« Ma routine du soir » ajouté à ton planning')}>
              Succès
            </Bouton>
            <Bouton variante="contour" onClick={() => toast('Le planning arrive bientôt', 'info')}>
              Info
            </Bouton>
            <Bouton variante="contour" onClick={() => toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')}>
              Erreur
            </Bouton>
            <Bouton ref={boutonConfettis} variante="plein" onClick={() => gerbe(boutonConfettis.current, true)}>
              Confettis dorés
            </Bouton>
          </div>
        </Section>

        <Section titre="Compteur">
          <p className="font-titre text-[clamp(40px,12vw,64px)] font-medium text-bordeaux">
            <Compteur valeur={abonnes} />
          </p>
          <Bouton variante="fantome" taille="petit" onClick={() => setAbonnes((a) => a + 870)}>
            Ajouter 870 abonnées
          </Bouton>
        </Section>

        <Section titre="Chargement et état vide">
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <SkeletonCarte />
          <EtatVide titre="Rien trouvé, ma belle" texte="Essaie un autre mot, ou laisse-toi surprendre." />
        </Section>
      </Cascade>
    </main>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <Apparition className="flex flex-col gap-3.5">
      <h2 className="mx-0.5 font-titre text-[clamp(26px,7vw,32px)] font-normal italic">{titre}</h2>
      {children}
    </Apparition>
  )
}
