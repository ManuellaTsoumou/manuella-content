import { ImageResponse } from 'next/og'
import { Icone, chargerBodoni } from '@/lib/visuels-app'

// Les icônes de l'app : onglet du navigateur, Android, et Android « masquable » (découpée en cercle)
const ICONES = {
  onglet: { taille: 32, masquable: false },
  '192': { taille: 192, masquable: false },
  '512': { taille: 512, masquable: false },
  masquable: { taille: 512, masquable: true },
} as const

export function generateImageMetadata() {
  return Object.entries(ICONES).map(([id, { taille }]) => ({
    id,
    contentType: 'image/png',
    size: { width: taille, height: taille },
  }))
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const icone = ICONES[String(await id) as keyof typeof ICONES] ?? ICONES['512']
  return new ImageResponse(<Icone taille={icone.taille} masquable={icone.masquable} />, {
    width: icone.taille,
    height: icone.taille,
    fonts: await chargerBodoni('M'),
  })
}
