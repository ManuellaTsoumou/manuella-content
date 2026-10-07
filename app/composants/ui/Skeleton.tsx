// Formes d'attente élégantes : un reflet chaud glisse dessus pendant le chargement.
// Composants serveur : utilisables directement dans les fallback de <Suspense>.

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-surface-creuse ${className}`}>
      <div className="absolute inset-0 animate-reflet bg-linear-to-r from-transparent via-blanc/70 to-transparent" />
    </div>
  )
}

export function SkeletonCarte({ lignes = 2 }: { lignes?: number }) {
  return (
    <div aria-hidden="true" className="rounded-carte bg-surface p-5 shadow-douce flex flex-col gap-3">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-6 w-4/5 rounded-full" />
      {Array.from({ length: lignes }, (_, i) => (
        <Skeleton key={i} className={`h-3 rounded-full ${i === lignes - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

// Écran d'attente d'une page entière : en-tête + quelques cartes
export function SkeletonPage({ texte, cartes = 3 }: { texte: string; cartes?: number }) {
  return (
    <main className="min-h-dvh max-w-md mx-auto px-5 pt-8 pb-32">
      <p className="sr-only" role="status">
        {texte}
      </p>
      <Skeleton className="h-3 w-32 rounded-full" />
      <Skeleton className="mt-3 h-10 w-3/4 rounded-full" />
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: cartes }, (_, i) => (
          <SkeletonCarte key={i} lignes={i === 0 ? 3 : 2} />
        ))}
      </div>
    </main>
  )
}
