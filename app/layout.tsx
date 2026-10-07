import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import BarreNavigation from './composants/BarreNavigation'
import Fournisseurs from './composants/Fournisseurs'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Manuella Content',
  description: 'Ton espace pour créer, apprendre et faire grandir ta communauté',
}

export const viewport: Viewport = {
  themeColor: '#faf6f1',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
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
