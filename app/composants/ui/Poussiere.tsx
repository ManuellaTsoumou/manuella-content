'use client'

import { useEffect, useRef } from 'react'

type Props = {
  // Nombre de grains (34 sur l'accueil, 40 sur la connexion)
  nombre?: number
  // Teinte : or clair sur les couvertures, or profond sur l'ivoire
  teinte?: 'or' | 'or-profond'
  className?: string
}

const TEINTES = { or: '233,201,143', 'or-profond': '201,166,107' }

// La poussière dorée qui monte doucement (code des maquettes, en React).
// Rien du tout si le mouvement réduit est demandé ; pause quand l'onglet est caché.
export default function Poussiere({ nombre = 34, teinte = 'or', className = 'absolute inset-0' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    const taille = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      W = r.width
      H = r.height
      canvas.width = W * d
      canvas.height = H * d
      ctx.setTransform(d, 0, 0, d, 0, 0)
    }
    taille()
    const observateur = new ResizeObserver(taille)
    observateur.observe(canvas)

    const grains = Array.from({ length: nombre }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      v: Math.random() * 0.25 + 0.08,
      p: Math.random() * Math.PI * 2,
      a: Math.random() * 0.5 + 0.3,
    }))
    const couleur = TEINTES[teinte]

    let image = 0
    const boucle = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      for (const g of grains) {
        g.y -= g.v
        g.x += Math.sin(t / 2000 + g.p) * 0.2
        if (g.y < -5) {
          g.y = H + 5
          g.x = Math.random() * W
        }
        ctx.beginPath()
        ctx.fillStyle = `rgba(${couleur},${g.a * (0.6 + 0.4 * Math.sin(t / 700 + g.p))})`
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2)
        ctx.fill()
      }
      image = requestAnimationFrame(boucle)
    }
    image = requestAnimationFrame(boucle)

    const visibilite = () => {
      cancelAnimationFrame(image)
      if (!document.hidden) image = requestAnimationFrame(boucle)
    }
    document.addEventListener('visibilitychange', visibilite)

    return () => {
      cancelAnimationFrame(image)
      observateur.disconnect()
      document.removeEventListener('visibilitychange', visibilite)
    }
  }, [nombre, teinte])

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none z-[1] h-full w-full ${className}`} />
}
