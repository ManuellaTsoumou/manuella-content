'use client'

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { RESSORTS } from '@/lib/animation'

type CaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  coche: boolean
  children: ReactNode
  // Couleurs adaptées à un fond sombre
  surFondSombre?: boolean
}

// Case à cocher de la maquette (22 px, coins de 7 px, coche crème sur bordeaux) avec un petit rebond
export default function Case({ coche, children, surFondSombre = false, id, className = '', ...reste }: CaseProps) {
  const idAuto = useId()
  const idCase = id ?? idAuto
  const couleurs = coche
    ? surFondSombre
      ? 'bg-or border-or text-bordeaux-profond'
      : 'bg-bordeaux border-bordeaux text-creme'
    : surFondSombre
      ? 'border-creme/40 bg-transparent'
      : 'border-ligne bg-surface'

  return (
    <label htmlFor={idCase} className={`flex min-h-11 cursor-pointer items-start gap-2.5 ${className}`}>
      <input id={idCase} type="checkbox" checked={coche} className="peer sr-only" {...reste} />
      <motion.span
        aria-hidden="true"
        animate={{ scale: coche ? [1, 1.15, 1] : 1 }}
        transition={RESSORTS.rebond}
        className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bordeaux ${couleurs}`}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M20 6 9 17l-5-5"
            initial={false}
            animate={{ pathLength: coche ? 1 : 0, opacity: coche ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </svg>
      </motion.span>
      <span className="min-w-0 pt-0.5">{children}</span>
    </label>
  )
}
