import { Suspense, type CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import { Bodoni_Moda, Jost } from 'next/font/google'
import BarreNavigation from './composants/BarreNavigation'
import Fournisseurs from './composants/Fournisseurs'
import { LEOPARD_OR, LEOPARD_TEXTE } from '@/lib/leopard'
import { COULEUR_THEME } from '@/lib/marque'
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
}

export const viewport: Viewport = {
  themeColor: COULEUR_THEME,
  viewportFit: 'cover',
}

// Le motif léopard est généré une fois côté serveur et partagé en variables CSS
const motifs = { '--leo-or': LEOPARD_OR, '--leo-texte': LEOPARD_TEXTE } as CSSProperties

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${bodoni.variable} ${jost.variable}`} style={motifs}>
      <body className="antialiased">
        <Fournisseurs>
          {children}
          <Suspense fallback={null}>
            <BarreNavigation />
          </Suspense>
        </Fournisseurs>
      </body>
    </html>
  )
}
