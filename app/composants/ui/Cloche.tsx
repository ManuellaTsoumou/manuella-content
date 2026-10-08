'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useToast } from './Toast'

// La cloche des couvertures : un point doré quand des idées attendent, une petite secousse au toucher
export default function Cloche({ nombre }: { nombre: number }) {
  const toast = useToast()
  const [secousse, setSecousse] = useState(0)
  const message =
    nombre === 0
      ? 'Aucune idée en attente. Ta banque est à jour.'
      : nombre === 1
        ? '1 idée attend d’être validée dans ta Bibliothèque'
        : `${nombre} idées attendent d’être validées dans ta Bibliothèque`

  return (
    <motion.button
      type="button"
      aria-label={`Notifications : ${message}`}
      key={secousse}
      initial={secousse ? { rotate: -18 } : false}
      animate={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 6 }}
      onClick={() => {
        setSecousse((s) => s + 1)
        toast(message, 'info')
      }}
      className="relative grid size-[46px] flex-none place-items-center rounded-full border border-creme/25 bg-creme/10 text-blanc"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {nombre > 0 && (
        <span className="absolute top-2.5 right-[11px] size-2 rounded-full bg-or shadow-[0_0_0_2px_var(--color-bordeaux)]" />
      )}
    </motion.button>
  )
}
