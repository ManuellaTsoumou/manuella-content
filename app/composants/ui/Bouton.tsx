'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { motion, type HTMLMotionProps } from 'motion/react'
import { RESSORTS, appui } from '@/lib/animation'

type Variante = 'principal' | 'secondaire' | 'fantome' | 'clair'
type Taille = 'petit' | 'normal' | 'grand'

const VARIANTES: Record<Variante, string> = {
  principal: 'bg-accent text-blanc shadow-douce hover:shadow-elevee',
  secondaire: 'border border-accent text-accent bg-transparent hover:bg-accent-doux',
  fantome: 'text-accent bg-transparent hover:bg-accent-doux',
  clair: 'bg-blanc text-bordeaux-700 shadow-douce hover:shadow-elevee',
}

const TAILLES: Record<Taille, string> = {
  petit: 'h-9 px-4 text-sm rounded-full',
  normal: 'h-11 px-5 text-sm rounded-full',
  grand: 'h-13 px-6 text-base rounded-full',
}

export type BoutonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variante?: Variante
  taille?: Taille
  chargement?: boolean
  // Texte affiché pendant le chargement (ex. « Connexion… »)
  texteChargement?: string
  icone?: ReactNode
  pleineLargeur?: boolean
  children: ReactNode
}

export default function Bouton({
  variante = 'principal',
  taille = 'normal',
  chargement = false,
  texteChargement,
  icone,
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
      whileHover={inactif ? undefined : { y: -1 }}
      whileTap={inactif ? undefined : appui}
      transition={RESSORTS.rebond}
      className={`relative inline-flex items-center justify-center gap-2 font-medium select-none transition-[background-color,box-shadow,color] duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${TAILLES[taille]} ${pleineLargeur ? 'w-full' : ''} ${className}`}
      {...reste}
    >
      {chargement ? (
        <>
          <Points />
          <span>{texteChargement ?? children}</span>
        </>
      ) : (
        <>
          {icone}
          {children}
        </>
      )}
    </motion.button>
  )
}

// Trois points qui respirent pendant le chargement
function Points() {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

// Bouton d'envoi qui passe tout seul en chargement pendant une server action
export function BoutonEnvoi(props: Omit<BoutonProps, 'type' | 'chargement'>) {
  const { pending } = useFormStatus()
  return <Bouton {...props} type="submit" chargement={pending} />
}
