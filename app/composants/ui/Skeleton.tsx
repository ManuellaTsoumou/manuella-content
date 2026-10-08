// Formes d'attente : un reflet doux glisse dessus pendant le chargement.
// Composants serveur : utilisables directement dans les fallback de <Suspense>.

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-poudre ${className}`}>
      <div className="absolute inset-0 animate-reflet bg-linear-to-r from-transparent via-surface/60 to-transparent" />
    </div>
  )
}

export function SkeletonCarte({ lignes = 2 }: { lignes?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-[18px] shadow-carte">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-6 w-4/5 rounded-full" />
      {Array.from({ length: lignes }, (_, i) => (
        <Skeleton key={i} className={`h-3 rounded-full ${i === lignes - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

// Écran d'attente : une couverture bordeaux silencieuse, puis quelques cartes
export function SkeletonPage({ texte, cartes = 3 }: { texte: string; cartes?: number }) {
  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px]">
      <p className="sr-only" role="status">
        {texte}
      </p>
      <div
        aria-hidden="true"
        className="fond-couverture grain -mx-4 -mt-[calc(18px+env(safe-area-inset-top,0px))] h-[38vh] rounded-b-feuille carte:m-0 carte:rounded-feuille"
      />
      <div className="mt-[30px] flex flex-col gap-3">
        {Array.from({ length: cartes }, (_, i) => (
          <SkeletonCarte key={i} lignes={i === 0 ? 3 : 2} />
        ))}
      </div>
    </main>
  )
}
