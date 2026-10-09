import { Suspense, type CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Bodoni_Moda, Jost } from 'next/font/google'
import BarreNavigation from './composants/BarreNavigation'
import Fournisseurs from './composants/Fournisseurs'
import { LEOPARD_OR, LEOPARD_TEXTE } from '@/lib/leopard'
import { CLE_INTRO, COULEUR_THEME } from '@/lib/marque'
import { ECRANS_IPHONE } from '@/lib/visuels-app'
import './globals.css'

// Titres, souvent en italique ; l'axe « opsz » affine le dessin selon la taille
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-bodoni',
})

// Interface
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
})

export const metadata: Metadata = {
  title: 'Manuella Content',
  description: 'Ton espace pour créer, apprendre et faire grandir ta communauté',
  applicationName: 'Manuella Content',
  // Installée sur l'écran d'accueil de l'iPhone : plein écran, nom court, écran de lancement bordeaux
  appleWebApp: {
    capable: true,
    title: 'Manuella',
    statusBarStyle: 'black-translucent',
    startupImage: ECRANS_IPHONE.map((e) => ({
      url: `/demarrage/${e.largeur}x${e.hauteur}`,
      media: `(device-width: ${e.largeur / e.ratio}px) and (device-height: ${e.hauteur / e.ratio}px) and (-webkit-device-pixel-ratio: ${e.ratio}) and (orientation: portrait)`,
    })),
  },
}

export const viewport: Viewport = {
  themeColor: COULEUR_THEME,
  viewportFit: 'cover',
}

// Le motif léopard est généré une fois côté serveur et partagé en variables CSS
const motifs = { '--leo-or': LEOPARD_OR, '--leo-texte': LEOPARD_TEXTE } as CSSProperties

// Lu avant l'affichage : si l'intro de la Bibliothèque a déjà été vue pendant cette session, elle ne clignote pas
const SCRIPT_INTRO = `try{if(sessionStorage.getItem('${CLE_INTRO}'))document.documentElement.dataset.introVue='1'}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning : le script de l'intro peut poser data-intro-vue sur <html> avant React (voulu)
    <html lang="fr" className={`${bodoni.variable} ${jost.variable}`} style={motifs} suppressHydrationWarning>
      <body className="antialiased">
        <Fournisseurs>
          {children}
          <Suspense fallback={null}>
            <BarreNavigation />
          </Suspense>
        </Fournisseurs>
        <Script id="intro-bibliotheque" strategy="beforeInteractive">
          {SCRIPT_INTRO}
        </Script>
      </body>
    </html>
  )
}
