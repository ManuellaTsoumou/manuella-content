'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const COULEURS = ['bg-champagne-400', 'bg-champagne-100', 'bg-bordeaux-300', 'bg-blanc']
const NOMBRE = 28

// Une pluie dorée discrète, du haut vers le bas, pour les moments qui comptent.
// Une seule fois, puis elle disparaît. Rien du tout si le mouvement réduit est demandé.
export default function Celebration() {
  const reduit = useReducedMotion()

  const eclats = useMemo(
    () =>
      Array.from({ length: NOMBRE }, (_, i) => {
        // Pseudo-aléatoire stable : même rendu à chaque fois pour un index donné
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
        return {
          x: r(1) * 100,
          derive: (r(2) - 0.5) * 120,
          chute: 55 + r(3) * 35,
          delai: r(4) * 0.35,
          duree: 1.6 + r(5) * 0.9,
          rotation: (r(6) - 0.5) * 540,
          taille: r(7) > 0.6 ? 'w-1.5 h-3' : 'size-1.5',
          rond: r(8) > 0.5,
          couleur: COULEURS[i % COULEURS.length],
        }
      }),
    []
  )

  if (reduit) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {eclats.map((e, i) => (
        <motion.span
          key={i}
          className={`absolute top-0 ${e.taille} ${e.couleur} ${e.rond ? 'rounded-full' : 'rounded-[2px]'}`}
          style={{ left: `${e.x}%` }}
          initial={{ y: '-5vh', x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: `${e.chute}vh`,
            x: e.derive,
            rotate: e.rotation,
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: e.duree, delay: e.delai, ease: [0.25, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
