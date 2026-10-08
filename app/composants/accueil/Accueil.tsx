'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion, animate, useReducedMotion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { vibrer } from '@/lib/confettis'
import type { Format } from '@/lib/contenu'
import type { SujetCandidat } from '@/lib/suggestions'
import { basculerJourOff } from '@/app/actions'
import Avatar from '../ui/Avatar'
import Couverture from '../ui/Couverture'
import Lettres from '../ui/Lettres'
import { useToast } from '../ui/Toast'
import Cloche from '../ui/Cloche'
import Suggestions from './Suggestions'
import Semaine from './Semaine'
import Progression from './Progression'
import Raccourcis from './Raccourcis'

export type ContenuPrevu = { id: string; heure: string | null; titre: string; format: Format | null }
export type JourSemaine = { jour: string; numero: number; off: boolean; contenus: ContenuPrevu[] }
export type Reseau = { id: string; plateforme: string; pseudo: string; abonnes: number; objectif: number }

export type DonneesAccueil = {
  nom: string
  photo: string
  date: string
  salutation: string
  phrase: string
  serie: number
  jourOff: boolean
  ideesEnAttente: number
  suggestions: SujetCandidat[]
  semaine: JourSemaine[]
  aujourdhui: string
  reseaux: Reseau[]
}

// Moments de la chorégraphie d'arrivée (timeline GSAP d'accueil.html)
export const ARRIVEE = { couverture: 0, haut: 0.4, salut: 0.7, prenom: 0.9, citation: 1.3, sections: 1.5, anneaux: 2.1 }

export default function Accueil({ donnees }: { donnees: DonneesAccueil }) {
  const toast = useToast()
  const [jourOff, setJourOff] = useState(donnees.jourOff)
  const [semaine, setSemaine] = useState(donnees.semaine)
  const [, demarrer] = useTransition()
  const indexAujourdhui = semaine.findIndex((j) => j.jour === donnees.aujourdhui)

  function basculer() {
    const actif = !jourOff
    setJourOff(actif)
    setSemaine((s) => s.map((j, i) => (i === indexAujourdhui ? { ...j, off: actif } : j)))
    vibrer(12)
    toast(actif ? 'Jour off activé. Prends soin de toi.' : 'On reprend en douceur.')
    demarrer(async () => {
      const { ok } = await basculerJourOff(actif)
      if (!ok) {
        setJourOff(!actif)
        toast('Ça n’a pas marché cette fois. Réessaie dans un instant.', 'erreur')
      }
    })
  }

  // « Je le prends » : le sujet apparaît tout de suite dans la journée d'aujourd'hui
  function ajouterAujourdhui(sujet: SujetCandidat) {
    setSemaine((s) =>
      s.map((j, i) =>
        i === indexAujourdhui
          ? { ...j, contenus: [...j.contenus, { id: `local-${sujet.id}`, heure: null, titre: sujet.titre, format: sujet.format }] }
          : j
      )
    )
  }

  return (
    <main className="relative mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: COURBES.expo }}
      >
        <Couverture repos={jourOff} aria-label="Bienvenue">
          <motion.div
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: ARRIVEE.haut, duration: 0.5, ease: COURBES.power3 }}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <Avatar src={donnees.photo} priorite />
              <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">{donnees.date}</p>
            </div>
            <Cloche nombre={donnees.ideesEnAttente} />
          </motion.div>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: ARRIVEE.salut, duration: 0.4 }}
            className="mt-[34px] text-sm uppercase tracking-[0.3em] text-sur-bordeaux"
          >
            {donnees.salutation}
          </motion.p>
          <h1 className="mt-1 whitespace-nowrap font-titre text-[clamp(40px,16cqi,104px)] font-normal italic leading-[0.95] tracking-[-0.02em]">
            <Lettres texte={donnees.nom} delai={ARRIVEE.prenom} ecart={0.045} duree={0.8} />
          </h1>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: ARRIVEE.citation, duration: 0.5, ease: COURBES.power3 }}
            className="mt-5 flex max-w-[560px] items-start gap-3"
          >
            <span aria-hidden="true" className="flex-none font-titre text-[54px] leading-[0.7] text-or">
              “
            </span>
            <p className="font-titre text-[clamp(19px,5.2vw,24px)] italic leading-[1.3] text-citation">{donnees.phrase}</p>
          </motion.div>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: ARRIVEE.citation + 0.1, duration: 0.5, ease: COURBES.power3 }}
            className="mt-[22px] flex flex-wrap items-center gap-2.5"
          >
            {!jourOff && <Serie jours={donnees.serie} />}
            <Interrupteur actif={jourOff} onClick={basculer} />
          </motion.div>
        </Couverture>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {jourOff ? (
          <motion.div
            key="repos"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.7, ease: COURBES.expo }}
            className="mt-[30px] grain rounded-[28px] bg-poudre px-6 py-7 text-bordeaux"
          >
            <h2 className="relative z-[2] font-titre text-[clamp(28px,8vw,40px)] font-normal italic leading-[1.05]">
              Aujourd’hui, tu te reposes.
            </h2>
            <p className="relative z-[2] mt-3 text-base leading-normal text-texte opacity-80">
              C’est aussi ça, prendre soin de toi. Pas de suggestion, pas de planning, pas de pression. Ta
              communauté sera encore là demain.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="travail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="mt-[30px] grid items-start gap-[30px] bureau:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
          >
            <div className="flex min-w-0 flex-col gap-[30px]">
              <Suggestions suggestions={donnees.suggestions} surPrise={ajouterAujourdhui} />
              <Semaine semaine={semaine} indexAujourdhui={indexAujourdhui} />
            </div>
            <div className="flex min-w-0 flex-col gap-[30px]">
              <Progression reseaux={donnees.reseaux} />
              <Raccourcis />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// En-tête de section : grand titre italique + mention discrète à droite
export function TeteDeSection({ titre, children, rang = 0 }: { titre: string; children?: React.ReactNode; rang?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ARRIVEE.sections + rang * 0.05, duration: 0.6, ease: COURBES.power3 }}
      className="mx-0.5 mb-3.5 flex items-baseline justify-between gap-3"
    >
      <h2 className="font-titre text-[clamp(26px,7vw,32px)] font-normal italic">{titre}</h2>
      {children && <span className="text-right text-[13px] text-texte-doux">{children}</span>}
    </motion.div>
  )
}

function Serie({ jours }: { jours: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduit = useReducedMotion()

  // Le compteur monte de 0 à la série, une seconde après l'arrivée
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (reduit) {
      element.textContent = String(jours)
      return
    }
    const controles = animate(0, jours, {
      delay: 1,
      duration: 1.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => (element.textContent = String(Math.round(v))),
    })
    return () => controles.stop()
  }, [jours, reduit])

  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-creme/20 bg-creme/12 px-4 text-sm">
      <span aria-hidden="true" className="inline-block origin-[50%_90%] animate-flamme">
        🔥
      </span>
      <span>
        <span className="sr-only">{jours}</span>
        <b ref={ref} aria-hidden="true">
          0
        </b>{' '}
        {jours > 1 ? 'jours' : 'jour'} d’affilée
      </span>
    </span>
  )
}

function Interrupteur({ actif, onClick }: { actif: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-creme/20 bg-creme/12 py-0 pr-1.5 pl-4 text-sm text-blanc"
    >
      Jour off
      <span className={`relative h-7 w-[46px] rounded-full transition-colors duration-300 ${actif ? 'bg-or' : 'bg-creme/25'}`}>
        <span
          className={`absolute top-[3px] left-[3px] size-[22px] rounded-full bg-blanc transition-transform duration-[350ms] ease-doux ${
            actif ? 'translate-x-[18px]' : ''
          }`}
        />
      </span>
    </button>
  )
}
