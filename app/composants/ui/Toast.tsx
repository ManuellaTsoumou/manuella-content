'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RESSORTS } from '@/lib/animation'
import Celebration from './Celebration'

type Ton = 'succes' | 'info' | 'erreur' | 'celebration'

type Toast = { id: number; message: string; ton: Ton }

type ContexteToast = (message: string, ton?: Ton) => void

const Contexte = createContext<ContexteToast | null>(null)

// À appeler depuis n'importe quel composant client : toast('Sujet validé')
export function useToast() {
  const toast = useContext(Contexte)
  if (!toast) throw new Error('useToast doit être utilisé dans <FournisseurToasts>')
  return toast
}

const DUREE_AFFICHAGE = 4000

const STYLES: Record<Ton, string> = {
  succes: 'bg-encre text-blanc',
  info: 'bg-surface text-texte border border-bord',
  erreur: 'bg-bordeaux-700 text-blanc',
  celebration: 'bg-champagne-100 text-bordeaux-900 shadow-doree',
}

export function FournisseurToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [fete, setFete] = useState(0)
  const compteur = useRef(0)

  const fermer = useCallback((id: number) => {
    setToasts((liste) => liste.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ContexteToast>(
    (message, ton = 'succes') => {
      const id = ++compteur.current
      // Trois toasts maximum à l'écran : le plus ancien laisse sa place
      setToasts((liste) => [...liste.slice(-2), { id, message, ton }])
      if (ton === 'celebration') setFete(id)
      setTimeout(() => fermer(id), DUREE_AFFICHAGE)
    },
    [fermer]
  )

  return (
    <Contexte.Provider value={toast}>
      {children}
      {fete > 0 && <Celebration key={fete} />}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              role={t.ton === 'erreur' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: -24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.18 } }}
              transition={RESSORTS.doux}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              onDragEnd={(_, info) => info.offset.y < -20 && fermer(t.id)}
              className={`pointer-events-auto w-full max-w-sm rounded-bouton px-4 py-3 shadow-elevee flex items-center gap-3 ${STYLES[t.ton]}`}
            >
              <Icone ton={t.ton} />
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                type="button"
                onClick={() => fermer(t.id)}
                aria-label="Fermer le message"
                className="size-8 -mr-1 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Contexte.Provider>
  )
}

function Icone({ ton }: { ton: Ton }) {
  const chemins: Record<Ton, ReactNode> = {
    succes: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    info: <path d="M12 8h.01M11 12h1v5h1" />,
    erreur: <path d="M12 7v6M12 17h.01" />,
    celebration: <path d="M12 3l2.2 5.6L20 9.3l-4.4 3.9 1.3 5.8L12 16l-4.9 3 1.3-5.8L4 9.3l5.8-.7z" />,
  }
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ ...RESSORTS.rebond, delay: 0.08 }}
    >
      {chemins[ton]}
    </motion.svg>
  )
}
