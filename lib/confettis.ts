import confetti from 'canvas-confetti'
import { COULEURS_CONFETTIS } from './marque'

function mouvementReduit() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Une gerbe dorée qui part d'un élément (réglages repris de burstFrom dans les maquettes)
export function gerbe(element?: Element | null, grande = false) {
  if (mouvementReduit()) return
  const r = element?.getBoundingClientRect()
  confetti({
    particleCount: grande ? 140 : 45,
    spread: grande ? 95 : 60,
    startVelocity: grande ? 42 : 28,
    scalar: grande ? 1 : 0.8,
    ticks: 180,
    colors: COULEURS_CONFETTIS,
    zIndex: 120,
    origin: r
      ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
      : { y: 0.45 },
  })
}

// La grande pluie de l'écran de réussite de la connexion
export function pluieDeReussite() {
  if (mouvementReduit()) return
  confetti({
    particleCount: 150,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.45 },
    colors: ['#E9C98F', '#C9A66B', '#FBF3EA', '#FFFFFF', '#B02A44'],
    zIndex: 100,
  })
}

// Petite vibration sur téléphone, comme buzz() dans les maquettes
export function vibrer(motif: number | number[] = 10) {
  try {
    navigator.vibrate?.(motif)
  } catch {}
}
