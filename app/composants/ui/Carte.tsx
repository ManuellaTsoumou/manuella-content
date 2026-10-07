'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { RESSORTS, apparition, appui, survol } from '@/lib/animation'

type Ton = 'surface' | 'creuse' | 'bordeaux' | 'encre' | 'champagne'

const TONS: Record<Ton, string> = {
  surface: 'bg-surface text-texte shadow-douce',
  creuse: 'bg-surface-creuse text-texte',
  bordeaux: 'bg-bordeaux-700 text-blanc shadow-elevee',
  encre: 'bg-encre text-blanc',
  champagne: 'bg-champagne-100 text-texte shadow-doree',
}

type CarteProps = HTMLMotionProps<'article'> & {
  ton?: Ton
  // La carte se soulève au survol et s'enfonce à l'appui
  interactive?: boolean
  rembourrage?: boolean
}

// Carte de base. Placée dans une <Cascade>, elle apparaît à son tour.
export default function Carte({
  ton = 'surface',
  interactive = false,
  rembourrage = true,
  className = '',
  children,
  ...reste
}: CarteProps) {
  return (
    <motion.article
      variants={apparition}
      whileHover={interactive ? survol : undefined}
      whileTap={interactive ? appui : undefined}
      transition={RESSORTS.doux}
      className={`rounded-carte ${TONS[ton]} ${rembourrage ? 'p-5' : ''} ${
        interactive ? 'cursor-pointer transition-shadow duration-200 hover:shadow-elevee' : ''
      } ${className}`}
      {...reste}
    >
      {children}
    </motion.article>
  )
}
