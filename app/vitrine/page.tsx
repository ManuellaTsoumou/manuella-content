'use client'

import { useState } from 'react'
import Cascade, { Apparition } from '../composants/animation/Cascade'
import Bouton from '../composants/ui/Bouton'
import Champ, { ListeDeroulante } from '../composants/ui/Champ'
import Carte from '../composants/ui/Carte'
import Case from '../composants/ui/Case'
import Compteur from '../composants/ui/Compteur'
import EtatVide from '../composants/ui/EtatVide'
import { Skeleton, SkeletonCarte } from '../composants/ui/Skeleton'
import { useToast } from '../composants/ui/Toast'

// Page de démonstration du design system : chaque composant de base, au même endroit.
export default function Vitrine() {
  const toast = useToast()
  const [coche, setCoche] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [abonnes, setAbonnes] = useState(4280)
  const [cle, setCle] = useState(0)

  return (
    <main className="min-h-dvh max-w-md mx-auto px-5 pt-8 pb-32">
      <Cascade key={cle} className="flex flex-col gap-6">
        <Apparition>
          <p className="surtitre text-accent">Design system</p>
          <h1 className="mt-2 font-titre text-titre-1 font-medium">
            La <em className="text-accent">vitrine</em>
          </h1>
          <p className="mt-2 text-sm text-texte-doux">
            Tous les composants de base, pour les essayer avant de les retrouver partout.
          </p>
        </Apparition>

        <Section titre="Couleurs">
          <div className="grid grid-cols-5 gap-2">
            {[
              'bg-bordeaux-50', 'bg-bordeaux-100', 'bg-bordeaux-200', 'bg-bordeaux-300', 'bg-bordeaux-500',
              'bg-bordeaux-700', 'bg-bordeaux-800', 'bg-bordeaux-900', 'bg-encre', 'bg-encre-douce',
              'bg-ivoire', 'bg-ivoire-creux', 'bg-lin', 'bg-champagne-100', 'bg-champagne-400',
              'bg-soin', 'bg-mental', 'bg-evolution', 'bg-soin-pale', 'bg-evolution-pale',
            ].map((c) => (
              <div key={c} title={c.replace('bg-', '')} className={`aspect-square rounded-champ border border-bord ${c}`} />
            ))}
          </div>
        </Section>

        <Section titre="Typographie">
          <p className="font-titre text-affichage font-medium">Affichage</p>
          <p className="font-titre text-titre-1 italic text-accent">Grandis devant elles.</p>
          <p className="font-titre text-titre-2 font-semibold">Titre de carte</p>
          <p className="text-base">DM Sans pour l’interface, claire et posée.</p>
          <p className="surtitre text-texte-doux">Surtitre</p>
        </Section>

        <Section titre="Boutons">
          <div className="flex flex-wrap gap-2">
            <Bouton>Principal</Bouton>
            <Bouton variante="secondaire">Secondaire</Bouton>
            <Bouton variante="fantome">Fantôme</Bouton>
            <Bouton
              chargement={chargement}
              texteChargement="Un instant"
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
          <Champ label="Ton prénom" />
          <Champ label="Mot de passe" type="password" />
          <Champ label="Email" type="email" erreur="Il manque le @ dans ton email." defaultValue="manuella" />
          <ListeDeroulante label="Pilier" defaultValue="soin">
            <option value="soin">Prendre soin de soi</option>
            <option value="mental">Se construire mentalement</option>
            <option value="evolution">Évoluer, apprendre l’anglais</option>
          </ListeDeroulante>
          <Case coche={coche} onChange={() => setCoche((c) => !c)}>
            J’ai bu mes deux litres d’eau aujourd’hui
          </Case>
        </Section>

        <Section titre="Toasts">
          <div className="flex flex-wrap gap-2">
            <Bouton variante="secondaire" taille="petit" onClick={() => toast('Sujet validé. Belle intuition.')}>
              Succès
            </Bouton>
            <Bouton variante="secondaire" taille="petit" onClick={() => toast('Ton planning se met à jour.', 'info')}>
              Info
            </Bouton>
            <Bouton
              variante="secondaire"
              taille="petit"
              onClick={() => toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')}
            >
              Erreur
            </Bouton>
            <Bouton
              variante="secondaire"
              taille="petit"
              onClick={() => toast('Contenu publié ! Tu es incroyable.', 'celebration')}
            >
              Célébration
            </Bouton>
          </div>
        </Section>

        <Section titre="Compteur">
          <p className="font-titre text-affichage font-medium text-accent">
            <Compteur valeur={abonnes} />
          </p>
          <Bouton variante="fantome" taille="petit" onClick={() => setAbonnes((a) => a + 1250)}>
            Ajouter 1 250 abonnées
          </Bouton>
        </Section>

        <Section titre="Cartes en cascade">
          <Bouton variante="fantome" taille="petit" onClick={() => setCle((k) => k + 1)}>
            Rejouer l’apparition
          </Bouton>
          <Carte interactive>
            <p className="surtitre text-soin">Prendre soin de soi</p>
            <p className="mt-1 font-titre text-titre-3 font-semibold">Ma routine du soir en 5 minutes</p>
          </Carte>
          <Carte interactive ton="bordeaux">
            <p className="surtitre text-bordeaux-200">Suggestion du jour</p>
            <p className="mt-1 font-titre text-titre-3 font-semibold">Pourquoi j’ai arrêté de me comparer</p>
          </Carte>
          <Carte ton="champagne">
            <p className="surtitre text-champagne-700">Palier atteint</p>
            <p className="mt-1 font-titre text-titre-3 font-semibold">5 000 abonnées sur TikTok</p>
          </Carte>
        </Section>

        <Section titre="Chargement">
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <SkeletonCarte />
        </Section>

        <Section titre="État vide">
          <EtatVide
            titre="Rien ici pour l’instant, et c’est ok."
            texte="Chaque grande communauté a commencé par une page blanche. La tienne aussi."
          />
        </Section>
      </Cascade>
    </main>
  )
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <Apparition className="flex flex-col gap-3">
      <h2 className="surtitre text-texte-doux border-b border-bord pb-2">{titre}</h2>
      {children}
    </Apparition>
  )
}
