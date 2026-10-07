import type { ReactNode } from 'react'

// Quand il n'y a rien à montrer, la grande sœur parle quand même.
export default function EtatVide({
  titre,
  texte,
  children,
}: {
  titre: string
  texte?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="size-16 text-bordeaux-300" fill="none" stroke="currentColor" strokeWidth="1.4">
        {/* Un petit carnet ouvert avec une étoile : tout reste à écrire */}
        <path d="M8 16c8-3 16-3 24 2 8-5 16-5 24-2v34c-8-3-16-3-24 2-8-5-16-5-24-2z" />
        <path d="M32 18v34" />
        <path d="M46 6l1.5 3.8 4 .4-3 2.7.9 4-3.4-2.1-3.4 2.1.9-4-3-2.7 4-.4z" className="text-champagne-400" stroke="currentColor" />
      </svg>
      <p className="mt-4 font-titre italic text-titre-3 text-texte">{titre}</p>
      {texte && <p className="mt-2 max-w-xs text-sm text-texte-doux leading-relaxed">{texte}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
