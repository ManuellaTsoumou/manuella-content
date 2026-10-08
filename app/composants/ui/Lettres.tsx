'use client'

import { motion } from 'motion/react'
import { COURBES } from '@/lib/animation'

type Props = {
  texte: string
  // Moment où la première lettre commence à monter (en secondes)
  delai?: number
  // Écart entre deux lettres (.05 sur la connexion, .035 sur la Bibliothèque)
  ecart?: number
  duree?: number
  // Légère rotation à l'arrivée (titre de la Bibliothèque)
  rotation?: number
  className?: string
}

// Un mot qui apparaît lettre par lettre : chaque lettre monte depuis sous sa ligne (masque).
// Les lecteurs d'écran lisent le mot entier, une seule fois.
export default function Lettres({ texte, delai = 0, ecart = 0.05, duree = 0.85, rotation = 0, className = '' }: Props) {
  return (
    <span className={className}>
      <span className="sr-only">{texte}</span>
      {Array.from(texte).map((lettre, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom px-[0.03em] pb-[0.1em]"
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '115%', rotate: rotation }}
            animate={{ y: '0%', rotate: 0 }}
            transition={{ delay: delai + i * ecart, duration: duree, ease: COURBES.expo }}
          >
            {lettre === ' ' ? ' ' : lettre}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
