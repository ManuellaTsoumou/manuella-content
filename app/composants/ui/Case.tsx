'use client'

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { DUREES, COURBES, RESSORTS } from '@/lib/animation'

type CaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  coche: boolean
  children: ReactNode
  // Couleurs adaptées à un fond sombre
  surFondSombre?: boolean
}

// Case à cocher : la coche se dessine et la case rebondit légèrement
export default function Case({ coche, children, surFondSombre = false, id, className = '', ...reste }: CaseProps) {
  const idAuto = useId()
  const idCase = id ?? idAuto
  const couleurCase = surFondSombre
    ? coche
      ? 'bg-bordeaux-200 border-bordeaux-200 text-bordeaux-900'
      : 'border-bordeaux-200/60'
    : coche
      ? 'bg-accent border-accent text-blanc'
      : 'border-encre-douce/50 bg-surface'

  return (
    <label htmlFor={idCase} className={`flex gap-3 items-start cursor-pointer ${className}`}>
      <input id={idCase} type="checkbox" checked={coche} className="peer sr-only" {...reste} />
      <motion.span
        aria-hidden="true"
        animate={{ scale: coche ? [1, 1.15, 1] : 1 }}
        transition={RESSORTS.rebond}
        className={`mt-0.5 size-5.5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors duration-200 peer-focus-visible:shadow-focus ${couleurCase}`}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.2">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: coche ? 1 : 0, opacity: coche ? 1 : 0 }}
            transition={{ duration: DUREES.base, ease: COURBES.sortie }}
          />
        </svg>
      </motion.span>
      <span className="min-w-0">{children}</span>
    </label>
  )
}
