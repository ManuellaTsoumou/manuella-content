import type { ReactNode } from 'react'
import Poussiere from './Poussiere'

type Props = {
  children: ReactNode
  // Couleurs apaisées du jour off
  repos?: boolean
  // Plein écran (connexion) : pas d'arrondi ni de marges négatives
  pleinEcran?: boolean
  nombreGrains?: number
  className?: string
  'aria-label'?: string
}

// La couverture bordeaux qui ouvre chaque écran : dégradé + grain + halos qui dérivent + poussière dorée.
// Sur téléphone elle touche les bords et s'arrondit en bas ; dès 700 px elle devient une carte arrondie.
export default function Couverture({
  children,
  repos = false,
  pleinEcran = false,
  nombreGrains = 34,
  className = '',
  ...reste
}: Props) {
  const forme = pleinEcran
    ? ''
    : '-mx-4 -mt-[calc(18px+env(safe-area-inset-top,0px))] rounded-b-feuille px-[18px] pt-[calc(18px+env(safe-area-inset-top,0px))] pb-7 carte:m-0 carte:rounded-feuille carte:px-[34px] carte:pt-[26px] carte:pb-[34px] max-[360px]:-mx-3 max-[360px]:px-3'

  return (
    <section
      className={`@container relative overflow-hidden grain text-blanc shadow-couverture transition-[background] duration-700 ${repos ? 'fond-repos' : 'fond-couverture'} ${forme} ${className}`}
      {...reste}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[25vmax] -top-[30vmax] z-0 size-[60vmax] rounded-full bg-halo-rubis blur-[50px] animate-[derive_18s_ease-in-out_infinite_alternate]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[22vmax] -right-[18vmax] z-0 size-[40vmax] rounded-full bg-halo-or blur-[50px] animate-[derive_22s_ease-in-out_infinite_alternate-reverse]"
      />
      <Poussiere nombre={nombreGrains} />
      <div className="relative z-[2]">{children}</div>
    </section>
  )
}
