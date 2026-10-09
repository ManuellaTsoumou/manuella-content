import { PALETTE_IMAGES as C } from './marque'

// Icônes et écrans de lancement générés avec ImageResponse (next/og), une seule fois au déploiement.

// Bodoni Moda italique, réduite aux lettres utiles (TTF : le seul format lu par ImageResponse).
// Si Google Fonts ne répond pas, l'image se génère quand même avec la police par défaut.
export async function chargerBodoni(texte: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@1,500&text=${encodeURIComponent(texte)}`)
    ).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1]
    if (!url) return []
    const data = await (await fetch(url)).arrayBuffer()
    return [{ name: 'Bodoni', data, style: 'italic' as const, weight: 500 as const }]
  } catch {
    return []
  }
}

const FOND = `radial-gradient(circle at 100% 0%, ${C.bordeauxClair} 0%, rgba(163,48,74,0) 60%), radial-gradient(circle at 0% 100%, ${C.bordeauxSombre} 0%, rgba(58,9,18,0) 65%), ${C.bordeaux}`

// L'icône : un « M » doré en italique sur le dégradé bordeaux, cerclé d'un liseré d'or.
// « masquable » : marges plus larges pour Android, qui découpe l'icône en cercle ou en goutte.
export function Icone({ taille, masquable = false }: { taille: number; masquable?: boolean }) {
  const cadre = masquable ? 0.62 : 0.78
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: FOND }}>
      <div
        style={{
          width: taille * cadre,
          height: taille * cadre,
          borderRadius: '50%',
          border: `${Math.max(1, taille * 0.012)}px solid ${C.or}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Bodoni',
            fontStyle: 'italic',
            fontSize: taille * cadre * 0.62,
            color: C.or,
            lineHeight: 1,
            marginTop: -taille * 0.02,
          }}
        >
          M
        </span>
      </div>
    </div>
  )
}

// L'écran de lancement iPhone : le monogramme, puis « Manuella » et « Content » espacé
export function EcranDeLancement({ largeur, hauteur }: { largeur: number; hauteur: number }) {
  const base = Math.min(largeur, hauteur)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: FOND,
      }}
    >
      <div
        style={{
          width: base * 0.3,
          height: base * 0.3,
          borderRadius: '50%',
          border: `${base * 0.004}px solid ${C.or}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Bodoni', fontStyle: 'italic', fontSize: base * 0.19, color: C.or, lineHeight: 1 }}>M</span>
      </div>
      <span style={{ marginTop: base * 0.07, fontFamily: 'Bodoni', fontStyle: 'italic', fontSize: base * 0.13, color: C.creme, lineHeight: 1 }}>
        Manuella
      </span>
      <span style={{ marginTop: base * 0.03, fontSize: base * 0.032, letterSpacing: base * 0.012, color: C.roseTexte }}>CONTENT</span>
    </div>
  )
}

// Les écrans d'iPhone courants (taille en pixels réels et rapport de pixels)
export const ECRANS_IPHONE = [
  { largeur: 1290, hauteur: 2796, ratio: 3 }, // 14/15/16 Pro Max, Plus
  { largeur: 1179, hauteur: 2556, ratio: 3 }, // 14/15/16 Pro, 15/16
  { largeur: 1284, hauteur: 2778, ratio: 3 }, // 12/13/14 Pro Max, 14 Plus
  { largeur: 1170, hauteur: 2532, ratio: 3 }, // 12/13/14, 12/13 Pro
  { largeur: 1125, hauteur: 2436, ratio: 3 }, // X, XS, 11 Pro, mini
  { largeur: 1242, hauteur: 2688, ratio: 3 }, // XS Max, 11 Pro Max
  { largeur: 828, hauteur: 1792, ratio: 2 }, // XR, 11
  { largeur: 750, hauteur: 1334, ratio: 2 }, // SE, 8
]
