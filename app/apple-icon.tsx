import { ImageResponse } from 'next/og'
import { Icone, chargerBodoni } from '@/lib/visuels-app'

// L'icône de l'écran d'accueil de l'iPhone (iOS arrondit lui-même les coins)
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  return new ImageResponse(<Icone taille={180} />, { ...size, fonts: await chargerBodoni('M') })
}
