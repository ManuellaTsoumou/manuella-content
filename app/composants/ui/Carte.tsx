'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { RESSORTS, apparition, appui, survol } from '@/lib/animation'
import type { Pilier } from '@/lib/contenu'

export { NOMS_PILIERS, type Pilier } from '@/lib/contenu'

type Ton = 'surface' | 'poudre' | Pilier

// surface : .s-card / .p-card ; poudre : .card-off ; piliers : tuiles et cartes de suggestion
const TONS: Record<Ton, string> = {
  surface: 'bg-surface text-texte border border-ligne shadow-carte',
  poudre: 'bg-poudre text-bordeaux grain',
  soin: 'art-soin grain',
  mental: 'art-mental grain',
  evoluer: 'art-evoluer grain',
}

type CarteProps = HTMLMotionProps<'article'> & {
  ton?: Ton
  // La carte se soulève au survol et s'enfonce à l'appui
  interactive?: boolean
}

// Placée dans une <Cascade>, la carte apparaît à son tour.
export default function Carte({ ton = 'surface', interactive = false, className = '', children, ...reste }: CarteProps) {
  return (
    <motion.article
      variants={apparition}
      whileHover={interactive ? survol : undefined}
      whileTap={interactive ? appui : undefined}
      transition={RESSORTS.doux}
      className={`relative overflow-hidden rounded-carte p-[18px] ${TONS[ton]} ${
        interactive ? 'cursor-pointer transition-shadow duration-[250ms] hover:shadow-survol' : ''
      } ${className}`}
      {...reste}
    >
      {children}
    </motion.article>
  )
}

// Grand numéro éditorial en filigrane, en bas à droite d'une tuile ou d'une carte
export function NumeroFiligrane({ numero, className = 'text-[120px] -right-1 -bottom-[26px]' }: { numero: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`filigrane absolute z-0 ${className}`}>
      {numero}
    </span>
  )
}
