import type { MetadataRoute } from 'next'
import { COULEUR_THEME } from '@/lib/marque'

// Ce qui fait de Manuella Content une app installable : nom, couleurs, plein écran, icônes.
// Sur Android, l'écran de lancement est composé automatiquement : fond bordeaux + icône + nom.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Manuella Content',
    short_name: 'Manuella',
    description: 'Ton espace pour créer, apprendre et faire grandir ta communauté',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: COULEUR_THEME,
    theme_color: COULEUR_THEME,
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon/masquable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
