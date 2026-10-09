'use client'

import { useRef, type PointerEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { ART, NOMS_PILIERS } from '@/lib/contenu'
import { NumeroFiligrane } from '../ui/Carte'
import type { ThemeAffiche } from './Bibliotheque'

const TAILLES = {
  big: 'col-span-2 row-span-2',
  wide: 'col-span-2',
  tall: 'row-span-2',
  small: '',
}

const NOMS = {
  big: 'text-[clamp(46px,12vw,76px)] italic font-normal',
  wide: 'text-[clamp(23px,7vw,30px)] font-medium',
  tall: 'text-[clamp(23px,7vw,30px)] font-medium',
  small: 'text-[clamp(17px,5.4vw,22px)] font-medium',
}

// La lumière chaude qui suit le doigt ou la souris (::before)
const LUEUR =
  "before:pointer-events-none before:absolute before:inset-0 before:z-[2] before:opacity-0 before:transition-opacity before:duration-[350ms] before:bg-[radial-gradient(260px_circle_at_var(--mx,50%)_var(--my,50%),var(--color-lueur),transparent_60%)] hover:before:opacity-100 focus-visible:before:opacity-100 data-[appui]:before:opacity-100"

type Props = {
  theme: ThemeAffiche
  rang: number
  // Phase d'arrivée de la page (cascade avec bascule 3D) ou apparition après un filtrage
  arrivee: 'attente' | 'cascade' | 'filtre'
  surOuvrir: (theme: ThemeAffiche, element: HTMLElement) => void
}

export default function Tuile({ theme, rang, arrivee, surOuvrir }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduit = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(rx, { stiffness: 180, damping: 12 })
  const rotateY = useSpring(ry, { stiffness: 180, damping: 12 })
  const vrac = theme.id === 'vrac'
  const grand = theme.taille === 'big'
  const large = grand || theme.taille === 'wide'

  function suivre(e: PointerEvent<HTMLButtonElement>) {
    const b = e.currentTarget
    const r = b.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    b.style.setProperty('--mx', `${x}px`)
    b.style.setProperty('--my', `${y}px`)
    // Inclinaison 3D seulement à la souris (pas au doigt), et jamais en mouvement réduit
    if (e.pointerType === 'mouse' && !reduit && window.matchMedia('(pointer: fine)').matches) {
      ry.set((x / r.width - 0.5) * 9)
      rx.set(-(y / r.height - 0.5) * 9)
    }
  }

  const arriveeCascade = {
    initial: { opacity: 0, y: 70, rotateX: -18 },
    animate: arrivee === 'attente' ? undefined : { opacity: 1, y: 0, rotateX: 0 },
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      layout
      lang="fr"
      aria-label={`Ouvrir le thème ${theme.nom}, ${theme.faits} sujet${theme.faits > 1 ? 's' : ''} traité${theme.faits > 1 ? 's' : ''} sur ${theme.total}`}
      initial={arrivee === 'filtre' ? { opacity: 0, scale: 0.8 } : arriveeCascade.initial}
      animate={arrivee === 'filtre' ? { opacity: 1, scale: 1, y: 0, rotateX: 0 } : arriveeCascade.animate}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      transition={
        arrivee === 'filtre'
          ? { duration: 0.5, ease: [0.34, 1.6, 0.64, 1], layout: { duration: 0.65, ease: [0.65, 0, 0.35, 1] } }
          : { delay: rang * 0.06, duration: 0.9, ease: COURBES.expo, layout: { duration: 0.65, ease: [0.65, 0, 0.35, 1] } }
      }
      whileTap={{ scale: 0.97 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={suivre}
      onPointerDown={(e) => {
        suivre(e)
        e.currentTarget.dataset.appui = ''
      }}
      onPointerUp={(e) => delete e.currentTarget.dataset.appui}
      onPointerLeave={(e) => {
        delete e.currentTarget.dataset.appui
        rx.set(0)
        ry.set(0)
      }}
      onClick={(e) => surOuvrir(theme, e.currentTarget)}
      className={`group grain relative flex min-w-0 flex-col justify-between overflow-hidden rounded-carte p-4 text-left [transform-style:preserve-3d] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-or max-[360px]:rounded-[22px] max-[360px]:p-[13px] ${LUEUR} ${TAILLES[theme.taille]} ${
        vrac ? 'border border-dashed border-bordeaux/30 bg-surface text-bordeaux [--chip:rgb(110_20_35/0.08)] [--deco:rgb(110_20_35/0.15)] [--sub:var(--color-texte-doux)]' : ART[theme.pilier]
      }`}
    >
      <NumeroFiligrane
        numero={theme.numero}
        className={grand ? '-right-1 -bottom-[50px] text-[230px]' : '-right-1 -bottom-[26px] text-[120px]'}
      />
      <span className="relative z-[3] flex items-start justify-between gap-2">
        <span className="surtitre text-(--sub)">{vrac ? 'À ranger' : NOMS_PILIERS[theme.pilier]}</span>
        {grand && (
          <span className="rounded-full bg-(--chip) px-2.5 py-[5px] text-xs font-semibold">
            {theme.faits}/{theme.total} traités
          </span>
        )}
      </span>
      <span className="relative z-[3] flex flex-col gap-1.5">
        {large && theme.prochain && (
          <span className="max-w-[90%] text-[12.5px] text-(--sub)">Prochain : {theme.prochain}</span>
        )}
        <span className={`font-titre leading-none tracking-[-0.015em] hyphens-auto [overflow-wrap:break-word] ${NOMS[theme.taille]}`}>
          {theme.nom}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute right-3.5 bottom-3.5 z-[3] grid size-[34px] translate-y-1.5 place-items-center rounded-full bg-(--chip) opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </motion.button>
  )
}
