import { ImageResponse } from 'next/og'
import { ECRANS_IPHONE, EcranDeLancement, chargerBodoni } from '@/lib/visuels-app'

// Écrans de lancement de l'iPhone (/demarrage/1179x2556…), générés une fois au déploiement
export function generateStaticParams() {
  return ECRANS_IPHONE.map((e) => ({ ecran: `${e.largeur}x${e.hauteur}` }))
}

export async function GET(_requete: Request, { params }: { params: Promise<{ ecran: string }> }) {
  const { ecran } = await params
  const trouve = ECRANS_IPHONE.find((e) => `${e.largeur}x${e.hauteur}` === ecran)
  if (!trouve) return new Response('Écran inconnu', { status: 404 })

  return new ImageResponse(<EcranDeLancement largeur={trouve.largeur} hauteur={trouve.hauteur} />, {
    width: trouve.largeur,
    height: trouve.hauteur,
    fonts: await chargerBodoni('MManuel'),
  })
}
