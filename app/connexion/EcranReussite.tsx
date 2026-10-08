'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { pluieDeReussite } from '@/lib/confettis'

// expo.inOut de GSAP
const EXPO_IN_OUT = [0.87, 0, 0.13, 1] as const

type Props = {
  // Centre du bouton, d'où le cercle bordeaux s'ouvre
  origine: { x: number; y: number }
}

// Après la connexion : un cercle bordeaux s'ouvre depuis le bouton et couvre tout l'écran,
// la coche dorée tourne, les confettis tombent… puis l'accueil prend le relais.
export default function EcranReussite({ origine }: Props) {
  const reduit = useReducedMotion()
  const lien = useRef<HTMLAnchorElement>(null)
  const { x, y } = origine
  const rayon =
    typeof window === 'undefined'
      ? 2000
      : Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  useEffect(() => {
    const confettis = setTimeout(pluieDeReussite, reduit ? 0 : 500)
    const focus = setTimeout(() => lien.current?.focus({ preventScroll: true }), reduit ? 0 : 1000)
    return () => {
      clearTimeout(confettis)
      clearTimeout(focus)
    }
  }, [reduit])

  const element = (rang: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.55 + rang * 0.08, duration: 0.6, ease: COURBES.power3 },
  })

  return (
    <motion.section
      aria-live="polite"
      initial={{ clipPath: `circle(0px at ${x}px ${y}px)` }}
      animate={{ clipPath: `circle(${rayon}px at ${x}px ${y}px)` }}
      transition={{ duration: reduit ? 0 : 0.9, ease: EXPO_IN_OUT }}
      className="fond-couverture grain fixed inset-0 z-50 flex flex-col items-center justify-center gap-3.5 p-6 text-center text-blanc"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.7, ease: [0.34, 2, 0.64, 1] }}
        className="relative z-[2] grid size-[78px] place-items-center rounded-full bg-or/16 shadow-check"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-or">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </motion.div>
      <motion.h2
        {...element(1)}
        className="relative z-[2] mt-1.5 font-titre text-[clamp(36px,11vw,84px)] font-normal italic leading-[1.02] [overflow-wrap:break-word]"
      >
        C’est parti, Manuella
      </motion.h2>
      <motion.p {...element(2)} className="relative z-[2] max-w-[420px] text-[17px] font-light text-sur-bordeaux-clair">
        Ton espace t’attend. On crée quelque chose de beau aujourd’hui ?
      </motion.p>
      <motion.div {...element(3)} className="relative z-[2]">
        <Link
          ref={lien}
          href="/"
          className="mt-4 inline-flex min-h-14 items-center gap-2.5 rounded-[18px] bg-blanc px-[26px] font-semibold text-bordeaux no-underline shadow-clair hover:text-bordeaux-survol"
        >
          Ouvrir mon espace
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </Link>
      </motion.div>
    </motion.section>
  )
}
