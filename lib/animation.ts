import type { Transition, Variants } from 'motion/react'

// Les mêmes valeurs que dans globals.css, pour que CSS et Motion respirent au même rythme.
// Uniquement transform et opacity : c'est ce qui reste fluide à 60 images/seconde sur téléphone.

export const DUREES = {
  instant: 0.12,
  rapide: 0.2,
  base: 0.32,
  lente: 0.56,
  ceremonie: 0.9,
} as const

export const COURBES = {
  sortie: [0.22, 1, 0.36, 1],
  entree: [0.64, 0, 0.78, 0],
} as const

export const RESSORTS = {
  doux: { type: 'spring', stiffness: 260, damping: 30 },
  rebond: { type: 'spring', stiffness: 400, damping: 22 },
} as const satisfies Record<string, Transition>

export const DECALAGE_CASCADE = 0.05

// Un élément qui apparaît : léger glissement vers le haut + fondu
export const apparition: Variants = {
  cache: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUREES.lente, ease: COURBES.sortie },
  },
}

// Un parent dont les enfants apparaissent les uns après les autres
export const cascade: Variants = {
  cache: {},
  visible: { transition: { staggerChildren: DECALAGE_CASCADE, delayChildren: 0.04 } },
}

// Réactions au toucher, partagées par tous les éléments cliquables
export const appui = { scale: 0.97 }
export const survol = { y: -2 }
