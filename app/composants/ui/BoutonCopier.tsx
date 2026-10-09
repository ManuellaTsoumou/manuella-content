'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { vibrer } from '@/lib/confettis'
import { useToast } from './Toast'

// Copie un texte (hook, script, description…) pour le coller dans TikTok ou Instagram
export default function BoutonCopier({ texte, libelle, message }: { texte: string; libelle: string; message: string }) {
  const toast = useToast()
  const [copie, setCopie] = useState(false)

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte)
      vibrer(10)
      setCopie(true)
      toast(message)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      toast('Je n’ai pas pu copier. Sélectionne le texte à la main.', 'erreur')
    }
  }

  return (
    <button
      type="button"
      onClick={copier}
      className="inline-flex min-h-11 items-center gap-2 rounded-petit border border-ligne bg-transparent px-3.5 text-sm font-medium text-texte transition-[transform,background-color] duration-200 hover:bg-poudre active:scale-[0.96]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={copie ? 'ok' : 'copier'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-bordeaux"
        >
          {copie ? (
            <path d="M20 6 9 17l-5-5" />
          ) : (
            <>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
      {copie ? 'Copié' : libelle}
    </button>
  )
}
