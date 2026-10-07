'use client'

import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { COURBES } from '@/lib/animation'

const FORMAT = new Intl.NumberFormat('fr-FR')

// Un nombre qui défile jusqu'à sa valeur quand il entre à l'écran.
// Écrit directement dans le DOM : aucun rendu React à chaque image.
export default function Compteur({
  valeur,
  duree = 1.4,
  className = '',
}: {
  valeur: number
  duree?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const dejaVu = useRef(0)
  const visible = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduit = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element || !visible) return
    if (reduit) {
      element.textContent = FORMAT.format(valeur)
      return
    }
    const controles = animate(dejaVu.current, valeur, {
      duration: duree,
      ease: COURBES.sortie,
      onUpdate: (v) => {
        element.textContent = FORMAT.format(Math.round(v))
      },
    })
    dejaVu.current = valeur
    return () => controles.stop()
  }, [valeur, visible, reduit, duree])

  return (
    <span className={className}>
      {/* Les lecteurs d'écran lisent directement la valeur finale */}
      <span className="sr-only">{FORMAT.format(valeur)}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        0
      </span>
    </span>
  )
}
