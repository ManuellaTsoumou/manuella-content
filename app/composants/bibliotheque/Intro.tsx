'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import Avatar from '../ui/Avatar'
import Lettres from '../ui/Lettres'

// expo.inOut et back.out(1.6) de GSAP
const EXPO_IN_OUT = [0.87, 0, 0.13, 1] as const
const RETOUR = [0.34, 1.6, 0.64, 1] as const

type Props = {
  cle: string
  salutation: string
  nom: string
  photo: string
  // La page peut commencer à se révéler
  surFin: () => void
}

// L'intro plein écran de la Bibliothèque, jouée une seule fois par session.
export default function Intro({ cle, salutation, nom, photo, surFin }: Props) {
  const [etat, setEtat] = useState<'joue' | 'sortie' | 'finie'>('joue')
  const finAnnoncee = useRef(false)

  const annoncerFin = () => {
    if (finAnnoncee.current) return
    finAnnoncee.current = true
    surFin()
  }

  // Avant le premier affichage : déjà vue (ou mouvement réduit) → pas d'intro du tout
  useLayoutEffect(() => {
    let dejaVue = false
    try {
      dejaVue = !!sessionStorage.getItem(cle)
      sessionStorage.setItem(cle, '1')
    } catch {}
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (dejaVue || reduit) {
      // Voulu : retirer l'intro avant le premier affichage, sans clignotement
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEtat('finie')
      annoncerFin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fin de la chorégraphie, puis un court temps de pause, puis l'intro remonte
  useEffect(() => {
    if (etat !== 'joue') return
    const suite = setTimeout(() => setEtat('sortie'), 2650)
    return () => clearTimeout(suite)
  }, [etat])

  // La page commence à se révéler pendant que l'intro remonte
  useEffect(() => {
    if (etat !== 'sortie') return
    const revele = setTimeout(annoncerFin, 350)
    return () => clearTimeout(revele)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat])

  if (etat === 'finie') return null

  return (
    <motion.div
      className="intro-bibliotheque fond-rubis grain fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2.5 px-4 text-center text-creme"
      animate={etat === 'sortie' ? { y: '-100%' } : { y: 0 }}
      transition={{ duration: 0.9, ease: EXPO_IN_OUT }}
      onAnimationComplete={() => etat === 'sortie' && setEtat('finie')}
    >
      <motion.div
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.9, ease: RETOUR }}
        className="relative z-[2] mb-3.5"
      >
        <Avatar src={photo} taille={96} priorite />
      </motion.div>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: COURBES.power3 }}
        className="relative z-[2] text-[15px] uppercase tracking-[0.2em] text-sur-bordeaux"
      >
        {salutation}
      </motion.p>
      <h1 className="relative z-[2] whitespace-nowrap font-titre text-[clamp(40px,14vw,130px)] font-normal italic leading-[0.95] text-or">
        <Lettres texte={nom} delai={0.9} ecart={0.05} duree={0.8} />
      </h1>
      <motion.p
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5, ease: COURBES.power3 }}
        className="relative z-[2] mt-1.5 text-base text-sur-bordeaux"
      >
        Prête à créer quelque chose de beau ?
      </motion.p>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        onClick={() => setEtat('sortie')}
        className="absolute bottom-[calc(26px+env(safe-area-inset-bottom,0px))] z-[2] min-h-11 px-4 text-[13px] text-sur-bordeaux underline underline-offset-4"
      >
        Passer l’intro
      </motion.button>
    </motion.div>
  )
}
