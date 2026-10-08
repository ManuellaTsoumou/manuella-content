import type { CSSProperties } from 'react'
import Image from 'next/image'
import { PHOTO_MANUELLA } from '@/lib/marque'

type Props = {
  // 54 (en-têtes), 96 (intro), 132 (connexion)
  taille?: number
  // Couleur du liseré entre l'anneau et la photo : bordeaux sur une couverture, ivoire sur la page
  surFond?: 'bordeaux' | 'page'
  // Vitesse de rotation de l'anneau (8 s, ou 9 s sur la connexion)
  duree?: number
  ombre?: boolean
  priorite?: boolean
  // Permet de réduire la taille selon l'écran (ex. max-[360px]:size-[108px])
  className?: string
}

// La photo de Manuella dans un anneau doré qui tourne lentement.
// La photo, elle, reste droite : elle tourne en sens inverse de l'anneau.
export default function Avatar({
  taille = 54,
  surFond = 'bordeaux',
  duree = 8,
  ombre = false,
  priorite = false,
  className = '',
}: Props) {
  const grand = taille >= 100
  const animation = { animationDuration: `${duree}s` }

  return (
    <div
      aria-hidden="true"
      style={{ '--taille': `${taille}px`, padding: grand ? 4 : 3, ...animation } as CSSProperties}
      className={`size-(--taille) shrink-0 rounded-full bg-[conic-gradient(var(--color-or),var(--color-bordeaux-clair),var(--color-or-profond),var(--color-creme),var(--color-or))] animate-tourne ${
        ombre ? 'shadow-avatar' : ''
      } ${className}`}
    >
      <span
        style={{ borderWidth: grand ? 4 : 2, ...animation }}
        className={`relative block size-full overflow-hidden rounded-full bg-avatar animate-tourne-inverse ${
          surFond === 'bordeaux' ? 'border-bordeaux' : 'border-fond'
        }`}
      >
        <Image src={PHOTO_MANUELLA} alt="" fill sizes={`${taille}px`} priority={priorite} className="object-cover" />
      </span>
    </div>
  )
}
