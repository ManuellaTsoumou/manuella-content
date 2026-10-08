'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { COURBES, RESSORTS } from '@/lib/animation'
import { vibrer } from '@/lib/confettis'
import { useToast } from './ui/Toast'

type Onglet = {
  label: string
  icone: React.ReactNode
  // Lien vers l'écran, ou message tant que l'écran n'existe pas encore
  href?: string
  bientot?: string
}

// Icônes et ordre repris des maquettes
const ONGLETS: Onglet[] = [
  {
    label: 'Accueil',
    href: '/',
    icone: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>
    ),
  },
  {
    label: 'Bibliothèque',
    href: '/sujets',
    icone: (
      <>
        <path d="M4 4h5v16H4z" />
        <path d="M9 4h5v16H9z" />
        <path d="m14.5 5 4.5-1 2 15.5-4.5 1z" />
      </>
    ),
  },
  {
    label: 'Planning',
    bientot: 'Le planning arrive bientôt',
    icone: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    label: 'IA',
    bientot: 'L’agent IA arrive bientôt',
    icone: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
  },
  {
    label: 'Profil',
    bientot: 'Ton profil arrive bientôt',
    icone: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </>
    ),
  },
]

const PAGES_SANS_NAVIGATION = ['/connexion', '/mot-de-passe']

export default function BarreNavigation() {
  const chemin = usePathname()
  const toast = useToast()
  if (PAGES_SANS_NAVIGATION.some((p) => chemin.startsWith(p))) return null

  const style = 'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[20px] text-[11px] max-[360px]:text-[10px] transition-colors duration-[250ms]'

  return (
    <motion.nav
      aria-label="Navigation principale"
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: COURBES.expo, delay: 0.3 }}
      style={{ viewTransitionName: 'barre-navigation' }}
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-[480px] justify-between rounded-[26px] border border-ligne bg-fond-nav p-1.5 shadow-nav backdrop-blur-[18px] backdrop-saturate-[1.4] max-[360px]:inset-x-2"
    >
      {ONGLETS.map((onglet) => {
        const actif = onglet.href
          ? onglet.href === '/'
            ? chemin === '/'
            : chemin.startsWith(onglet.href)
          : false
        const contenu = (
          <>
            {actif && (
              <motion.span
                layoutId="onglet-actif"
                transition={RESSORTS.doux}
                className="absolute inset-0 rounded-[20px] bg-bordeaux"
              />
            )}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative">
              {onglet.icone}
            </svg>
            <span className="relative truncate max-w-full px-0.5">{onglet.label}</span>
          </>
        )

        return onglet.href ? (
          <Link
            key={onglet.label}
            href={onglet.href}
            aria-current={actif ? 'page' : undefined}
            onClick={() => vibrer(6)}
            className={`${style} ${actif ? 'font-semibold text-creme' : 'text-texte-doux hover:text-bordeaux'}`}
          >
            {contenu}
          </Link>
        ) : (
          <button
            key={onglet.label}
            type="button"
            onClick={() => {
              vibrer(6)
              toast(onglet.bientot!, 'info')
            }}
            className={`${style} text-texte-doux hover:text-bordeaux`}
          >
            {contenu}
          </button>
        )
      })}
    </motion.nav>
  )
}
