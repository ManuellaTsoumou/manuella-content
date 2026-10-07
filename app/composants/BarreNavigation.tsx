'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { RESSORTS } from '@/lib/animation'

const LIENS = [
  {
    href: '/',
    label: 'Accueil',
    icone: <path d="M4 11l8-7 8 7v9H4z" />,
  },
  {
    href: '/sujets',
    label: 'Sujets',
    icone: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M9 9h6M9 13h6" />
      </>
    ),
  },
]

export default function BarreNavigation() {
  const chemin = usePathname()
  if (chemin.startsWith('/connexion')) return null

  return (
    <nav
      aria-label="Navigation principale"
      style={{ viewTransitionName: 'barre-navigation' }}
      className="fixed bottom-0 inset-x-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="max-w-sm mx-auto grid grid-cols-2 gap-1 p-1.5 rounded-full bg-surface/85 backdrop-blur-xl shadow-elevee border border-bord/60">
        {LIENS.map((lien) => {
          const actif = lien.href === '/' ? chemin === '/' : chemin.startsWith(lien.href)
          return (
            <li key={lien.href} className="relative">
              {actif && (
                <motion.span
                  layoutId="onglet-actif"
                  transition={RESSORTS.doux}
                  className="absolute inset-0 rounded-full bg-accent"
                />
              )}
              <Link
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                className={`relative flex items-center justify-center gap-2 h-12 rounded-full text-sm transition-colors duration-200 ${
                  actif ? 'text-blanc font-medium' : 'text-texte-doux hover:text-accent'
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  {lien.icone}
                </svg>
                {lien.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
