// Motif léopard généré en SVG : repris tel quel de la maquette bibliotheque.html (fonction leopard).
// Purement décoratif : ruban sous les titres, cadre du dos des cartes, mini-cartes de « Surprends-moi ».

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export function leopard(spot: string, center: string, seed: number) {
  const S = 160
  const r = rng(seed)
  const shapes: { c: string; x: number; y: number; rx: number; ry: number; rot: number }[] = []
  const cells = 4
  const cs = S / cells

  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      const cx = gx * cs + cs / 2 + (r() - 0.5) * cs * 0.55
      const cy = gy * cs + cs / 2 + (r() - 0.5) * cs * 0.55
      const R = 8 + r() * 6
      const k = 3 + Math.floor(r() * 3)
      const a0 = r() * Math.PI * 2
      shapes.push({ c: center, x: cx, y: cy, rx: R * 0.78, ry: R * 0.62, rot: r() * 180 })
      for (let j = 0; j < k; j++) {
        const a = a0 + j * ((2 * Math.PI) / k) + (r() - 0.5) * 0.45
        shapes.push({
          c: spot,
          x: cx + Math.cos(a) * R,
          y: cy + Math.sin(a) * R,
          rx: R * (0.5 + r() * 0.35),
          ry: R * (0.2 + r() * 0.12),
          rot: (a * 180) / Math.PI + 90,
        })
      }
    }
  }
  for (let j = 0; j < 12; j++) {
    shapes.push({ c: spot, x: r() * S, y: r() * S, rx: 1.4 + r() * 2.4, ry: 1.1 + r() * 1.8, rot: r() * 180 })
  }

  let out = ''
  for (const sh of shapes) {
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        const x = sh.x + dx
        const y = sh.y + dy
        if (x < -24 || x > S + 24 || y < -24 || y > S + 24) continue
        out += `<ellipse cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' rx='${sh.rx.toFixed(1)}' ry='${sh.ry.toFixed(1)}' transform='rotate(${sh.rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})' fill='${sh.c}'/>`
      }
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}' viewBox='0 0 ${S} ${S}'>${out}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// Les deux variantes des maquettes, calculées une seule fois (côté serveur)
export const LEOPARD_OR = leopard('#E9C98F', 'rgba(233,201,143,.28)', 21)
export const LEOPARD_TEXTE = leopard('#1E120C', '#C9955A', 42)
