'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { motion, type HTMLMotionProps } from 'motion/react'
import { RESSORTS } from '@/lib/animation'

type Variante = 'principal' | 'plein' | 'clair' | 'contour' | 'or' | 'nuit' | 'fantome'
type Taille = 'petit' | 'normal' | 'moyen' | 'grand'

// Chaque variante correspond à un bouton des maquettes
const VARIANTES: Record<Variante, string> = {
  // .cta (connexion), .surprise : dégradé bordeaux + liseré doré
  principal: 'fond-bouton text-blanc font-medium shadow-bouton',
  // .b-take / .s-ai sur fond clair
  plein: 'bg-bordeaux text-creme font-semibold',
  // .go : bouton blanc sur une couverture
  clair: 'bg-blanc text-bordeaux font-semibold shadow-clair hover:text-bordeaux-survol',
  // .b-skip / .s-plan
  contour: 'border border-ligne bg-transparent text-texte font-medium',
  // .btn-gold
  or: 'bg-or text-bordeaux-profond font-semibold',
  // .d-ai
  nuit: 'bg-nuit text-creme font-semibold',
  fantome: 'bg-transparent text-bordeaux font-medium hover:text-bordeaux-survol',
}

const TAILLES: Record<Taille, string> = {
  petit: 'min-h-11 px-4 text-sm rounded-petit',
  normal: 'min-h-[46px] px-4 text-sm rounded-petit',
  moyen: 'min-h-14 px-5 text-[15px] rounded-[18px]',
  grand: 'min-h-16 px-[18px] text-base tracking-[0.01em] rounded-bouton max-[360px]:text-[15px] max-[360px]:px-3',
}

export type BoutonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variante?: Variante
  taille?: Taille
  chargement?: boolean
  texteChargement?: string
  // Reflet doré qui traverse le bouton (.shimmer)
  reflet?: boolean
  icone?: ReactNode
  iconeFin?: ReactNode
  pleineLargeur?: boolean
  children: ReactNode
}

export default function Bouton({
  variante = 'principal',
  taille = 'normal',
  chargement = false,
  texteChargement,
  reflet = false,
  icone,
  iconeFin,
  pleineLargeur = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...reste
}: BoutonProps) {
  const inactif = disabled || chargement

  return (
    <motion.button
      type={type}
      disabled={inactif}
      aria-busy={chargement || undefined}
      whileHover={inactif ? undefined : { y: -2 }}
      whileTap={inactif ? undefined : { scale: 0.98 }}
      transition={RESSORTS.rebond}
      className={`relative inline-flex items-center justify-center gap-3 text-center leading-tight select-none transition-[color,box-shadow] duration-200 disabled:cursor-progress focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-or ${reflet ? 'reflet' : 'overflow-hidden'} ${VARIANTES[variante]} ${TAILLES[taille]} ${pleineLargeur ? 'w-full' : ''} ${className}`}
      {...reste}
    >
      {chargement ? (
        <>
          <span
            aria-hidden="true"
            className="relative size-5 rounded-full border-2 border-current/35 border-t-or animate-[tourne_0.8s_linear_infinite]"
          />
          <span className="relative">{texteChargement ?? children}</span>
        </>
      ) : (
        <>
          {icone && <span className="relative flex">{icone}</span>}
          <span className="relative">{children}</span>
          {iconeFin && <span className="relative flex">{iconeFin}</span>}
        </>
      )}
    </motion.button>
  )
}

// Bouton d'envoi qui passe tout seul en chargement pendant une server action
export function BoutonEnvoi(props: Omit<BoutonProps, 'type' | 'chargement'>) {
  const { pending } = useFormStatus()
  return <Bouton {...props} type="submit" chargement={pending} />
}

// L'étincelle dorée du bouton de connexion et de l'IA
export function Etincelle({ taille = 20, className = 'text-or' }: { taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </svg>
  )
}
