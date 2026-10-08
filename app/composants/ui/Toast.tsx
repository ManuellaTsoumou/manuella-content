'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'

type Ton = 'succes' | 'info' | 'erreur'

type ContexteToast = (message: string, ton?: Ton) => void

const Contexte = createContext<ContexteToast | null>(null)

// À appeler depuis n'importe quel composant client : toast('Idée enregistrée')
export function useToast() {
  const toast = useContext(Contexte)
  if (!toast) throw new Error('useToast doit être utilisé dans <FournisseurToasts>')
  return toast
}

// Comme dans les maquettes : un seul message à la fois, visible 2,6 s
const DUREE_AFFICHAGE = 2600

export function FournisseurToasts({ children }: { children: ReactNode }) {
  const [courant, setCourant] = useState<{ id: number; message: string; ton: Ton } | null>(null)
  const minuterie = useRef<ReturnType<typeof setTimeout>>(undefined)
  const compteur = useRef(0)

  const toast = useCallback<ContexteToast>((message, ton = 'succes') => {
    clearTimeout(minuterie.current)
    setCourant({ id: ++compteur.current, message, ton })
    minuterie.current = setTimeout(() => setCourant(null), DUREE_AFFICHAGE)
  }, [])

  return (
    <Contexte.Provider value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(100px+env(safe-area-inset-bottom,0px))] z-[80] flex justify-center px-4"
      >
        <AnimatePresence>
          {courant && (
            <motion.div
              key={courant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: COURBES.doux }}
              className="flex w-max max-w-full items-center gap-2.5 rounded-[18px] bg-encre px-[18px] py-3.5 text-sm text-creme shadow-toast"
            >
              <Icone ton={courant.ton} />
              <span>{courant.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Contexte.Provider>
  )
}

function Icone({ ton }: { ton: Ton }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-or">
      {ton === 'erreur' ? (
        <path d="M12 7v6M12 17h.01" />
      ) : ton === 'info' ? (
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      ) : (
        <path d="M20 6 9 17l-5-5" />
      )}
    </svg>
  )
}
