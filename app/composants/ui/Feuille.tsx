'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useDragControls } from 'motion/react'
import { RESSORTS } from '@/lib/animation'

type Props = {
  titre: string
  surFermer: () => void
  children: ReactNode
}

// Panneau qui monte du bas de l'écran (pratique au pouce), voile sombre derrière.
// À placer dans un <AnimatePresence> pour l'animation de sortie.
export default function Feuille({ titre, surFermer, children }: Props) {
  const panneau = useRef<HTMLDivElement>(null)
  // Seule la poignée fait glisser le panneau : le contenu, lui, reste défilable
  const poignee = useDragControls()
  // Dernière version de surFermer, sans relancer l'ouverture à chaque rendu de la page
  const fermer = useRef(surFermer)
  useEffect(() => {
    fermer.current = surFermer
  })

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    panneau.current?.querySelector<HTMLElement>('button, a, input')?.focus({ preventScroll: true })
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && fermer.current()
    document.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', echap)
      avant?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-voile backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={surFermer}
    >
      <motion.div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={RESSORTS.doux}
        drag="y"
        dragListener={false}
        dragControls={poignee}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && surFermer()}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[32px] bg-fond px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-texte shadow-feuille"
      >
        <div
          aria-hidden="true"
          onPointerDown={(e) => poignee.start(e)}
          className="-mx-5 -mt-3 mb-2 flex cursor-grab touch-none justify-center pt-3 pb-2"
        >
          <span className="h-1.5 w-11 rounded-full bg-ligne" />
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
