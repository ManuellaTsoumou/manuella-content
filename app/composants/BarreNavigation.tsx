'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
      className="fixed bottom-0 inset-x-0 z-10 bg-white rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-md mx-auto grid grid-cols-2">
        {LIENS.map((lien) => {
          const actif = lien.href === '/' ? chemin === '/' : chemin.startsWith(lien.href)
          return (
            <li key={lien.href}>
              <Link
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-xs ${
                  actif ? 'text-bordeaux font-medium' : 'text-neutral-500'
                }`}
              >
                <svg
                  width="22"
                  height="22"
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
