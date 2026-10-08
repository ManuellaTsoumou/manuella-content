import type { Transition, Variants } from 'motion/react'

// Rythme repris des maquettes (GSAP) : expo.out pour les entrées, power3.out pour les apparitions.
// Uniquement transform et opacity : c'est ce qui reste fluide à 60 images/seconde sur téléphone.

export const DUREES = {
  instant: 0.15,
  rapide: 0.25,
  base: 0.4,
  lente: 0.6,
  ceremonie: 0.9,
} as const

export const COURBES = {
  expo: [0.16, 1, 0.3, 1], // expo.out
  power3: [0.215, 0.61, 0.355, 1], // power3.out
  doux: [0.2, 0.8, 0.2, 1], // cubic-bezier(.2,.8,.2,1) des maquettes
  entree: [0.55, 0.055, 0.675, 0.19], // power2.in
} as const

export const RESSORTS = {
  doux: { type: 'spring', stiffness: 260, damping: 30 },
  rebond: { type: 'spring', stiffness: 400, damping: 22 },
} as const satisfies Record<string, Transition>

export const DECALAGE_CASCADE = 0.05

// .from({ opacity:0, y:30, duration:.6, ease:"power3.out" }) des maquettes
export const apparition: Variants = {
  cache: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUREES.lente, ease: COURBES.power3 },
  },
}

export const cascade: Variants = {
  cache: {},
  visible: { transition: { staggerChildren: DECALAGE_CASCADE, delayChildren: 0.05 } },
}

export const appui = { scale: 0.97 }
export const survol = { y: -3 }
