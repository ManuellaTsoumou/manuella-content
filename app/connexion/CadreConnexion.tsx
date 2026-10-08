'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import Avatar from '../composants/ui/Avatar'
import Couverture from '../composants/ui/Couverture'
import Lettres from '../composants/ui/Lettres'
import RubanLeopard from '../composants/ui/RubanLeopard'

// back.out(1.5) de GSAP
const RETOUR = [0.34, 1.5, 0.64, 1] as const

// Moments de la chorégraphie d'arrivée, recalés sur la timeline GSAP de connexion.html
export const MOMENTS = {
  marque: 0,
  avatar: 0.3,
  bienvenue: 0.9,
  prenom: 1.15,
  phrase: 1.55,
  feuille: 1.45,
  contenu: 1.6,
}

const PHRASES = [
  'Ta communauté t’attend.',
  'Une idée peut tout changer.',
  'Grandis devant elles.',
  'Prête à inspirer aujourd’hui ?',
  'Prends soin de toi, dehors comme dedans.',
]

// Salutation selon l'heure, lue côté navigateur (« Bienvenue, » avant 18 h, « Bonsoir, » après)
const sAbonner = () => () => {}
const salutationNavigateur = () => (new Date().getHours() < 18 ? 'Bienvenue,' : 'Bonsoir,')
const salutationServeur = () => 'Bienvenue,'

type Props = {
  children: ReactNode
  // Le contenu de la feuille tremble en cas d'erreur : la page reçoit sa référence
  refContenu?: Ref<HTMLDivElement>
}

export default function CadreConnexion({ children, refContenu }: Props) {
  const salutation = useSyncExternalStore(sAbonner, salutationNavigateur, salutationServeur)

  return (
    <main className="flex min-h-dvh flex-col large:flex-row">
      <Couverture
        pleinEcran
        nombreGrains={40}
        aria-label="Accueil"
        classeContenu="contents"
        className="flex min-h-[56vh] flex-col items-center justify-center px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[70px] text-center tablette:max-large:min-h-[50vh] max-[360px]:px-4 large:sticky large:top-0 large:min-h-dvh large:flex-[1.15] large:self-start large:p-10 [@media(max-height:700px)]:min-h-0 [@media(max-height:700px)]:pt-[calc(54px+env(safe-area-inset-top,0px))] [@media(max-height:700px)]:pb-[60px] [@media(max-height:700px)_and_(min-width:900px)]:min-h-dvh [@media(max-height:700px)_and_(min-width:900px)]:pt-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MOMENTS.marque, duration: 0.6, ease: COURBES.power3 }}
          className="absolute inset-x-0 top-[calc(20px+env(safe-area-inset-top,0px))] z-[2] flex items-center justify-center gap-2.5 text-[11px] uppercase tracking-[0.28em] text-sur-bordeaux"
        >
          <i className="size-1.5 rotate-45 bg-or" />
          Manuella Content
          <i className="size-1.5 rotate-45 bg-or" />
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -140 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: MOMENTS.avatar, duration: 1, ease: RETOUR }}
          className="relative z-[2] mb-[22px] [@media(max-height:700px)]:mb-3.5"
        >
          <Avatar
            taille={132}
            duree={9}
            ombre
            priorite
            className="max-[360px]:size-[108px] [@media(max-height:700px)]:size-24"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MOMENTS.bienvenue, duration: 0.5, ease: COURBES.power3 }}
          className="relative z-[2] text-[13px] uppercase tracking-[0.32em] text-sur-bordeaux max-[360px]:tracking-[0.24em]"
        >
          {salutation}
        </motion.p>

        <h1 className="relative z-[2] mt-1.5 max-w-full whitespace-nowrap font-titre text-[clamp(40px,15cqi,112px)] font-normal italic leading-[0.95] tracking-[-0.02em] [@media(max-height:700px)]:text-[clamp(40px,13cqi,80px)]">
          <Lettres texte="Manuella" delai={MOMENTS.prenom} ecart={0.05} duree={0.85} />
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MOMENTS.phrase, duration: 0.5, ease: COURBES.power3 }}
          className="relative z-[2]"
        >
          <PhrasesTournantes />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: MOMENTS.phrase + 0.1, duration: 0.5, ease: COURBES.power3 }}
          className="relative z-[2] mt-5"
        >
          <RubanLeopard centre />
        </motion.div>
      </Couverture>

      <motion.section
        initial={{ y: '30%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: MOMENTS.feuille, duration: 0.9, ease: COURBES.expo }}
        className="relative z-[3] -mt-9 flex-1 rounded-t-feuille bg-fond px-[22px] pt-[34px] pb-[calc(30px+env(safe-area-inset-bottom,0px))] shadow-feuille max-[360px]:px-4 tablette:max-large:px-8 tablette:max-large:pt-10 tablette:max-large:pb-[calc(40px+env(safe-area-inset-bottom,0px))] large:mt-0 large:flex large:items-center large:rounded-none large:px-[clamp(32px,5vw,72px)] large:py-12 large:shadow-none"
      >
        <div ref={refContenu} className="mx-auto w-full max-w-[420px]">
          {children}
        </div>
      </motion.section>
    </main>
  )
}

// Un élément de la feuille qui arrive à son tour (.in des maquettes)
export function Entree({ rang, children, className = '' }: { rang: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: MOMENTS.contenu + rang * 0.07, duration: 0.6, ease: COURBES.power3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Une phrase qui change toutes les 3,2 s : elle s'efface vers le haut, la suivante arrive par le bas
function PhrasesTournantes() {
  const [rang, setRang] = useState(0)

  useEffect(() => {
    const minuterie = setInterval(() => setRang((r) => (r + 1) % PHRASES.length), 3200)
    return () => clearInterval(minuterie)
  }, [])

  return (
    // Pas d'aria-live ici : un lecteur d'écran répéterait une phrase toutes les 3 secondes
    <p className="mt-3.5 min-h-[26px] text-[17px] font-light text-sur-bordeaux-clair">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={rang}
          className="inline-block"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: COURBES.power3 } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.35, ease: COURBES.entree } }}
        >
          {PHRASES[rang]}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}
