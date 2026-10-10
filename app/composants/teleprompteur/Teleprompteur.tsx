'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'

export type FicheLue = {
  id: string
  sujetId: string
  titre: string
  hook: string | null
  script: string
}

// Réglages gardés d'une séance à l'autre sur ce téléphone
const CLE_REGLAGES = 'manuella-teleprompteur'
const VITESSE = { min: 1, max: 10 }
const TAILLE = { min: 26, max: 64, pas: 4 }
// La ligne de lecture dorée, à 35 % de la hauteur : les yeux restent près de l'objectif
const LIGNE = 0.35

type Reglages = { vitesse: number; taille: number; miroir: boolean }
const REGLAGES_DEFAUT: Reglages = { vitesse: 4, taille: 38, miroir: false }

function lireReglages(): Reglages {
  try {
    return { ...REGLAGES_DEFAUT, ...JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? '{}') }
  } catch {
    return REGLAGES_DEFAUT
  }
}

// Pixels par seconde : la vitesse suit la taille du texte, pour garder le même rythme de lecture
const pixelsParSeconde = ({ vitesse, taille }: Reglages) => (12 + vitesse * 9) * (taille / 38)

// Les repères de l'IA entre crochets ([raconte un moment où…]) ressortent en doré
function mettreEnForme(texte: string) {
  return texte.split(/(\[[^\]]+\])/g).map((morceau, i) =>
    morceau.startsWith('[') ? (
      <span key={i} className="font-titre text-[0.82em] italic text-or">
        {morceau}
      </span>
    ) : (
      morceau
    )
  )
}

export default function Teleprompteur({ fiche }: { fiche: FicheLue }) {
  const ecran = useRef<HTMLDivElement>(null)
  const texte = useRef<HTMLDivElement>(null)
  const barre = useRef<HTMLDivElement>(null)
  const temps = useRef<HTMLSpanElement>(null)
  const position = useRef(0)
  const enLecture = useRef(false)
  const verrou = useRef<{ release: () => Promise<void> } | null>(null)
  const glisse = useRef<{ y: number; depart: number } | null>(null)
  const masquage = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEFAUT)
  const reglagesRef = useRef(reglages)
  const [lecture, setLecture] = useState(false)
  const [decompte, setDecompte] = useState<number | null>(null)
  const [controles, setControles] = useState(true)
  const [fini, setFini] = useState(false)
  const [pleinEcran, setPleinEcran] = useState(false)

  // Réglages enregistrés, lus une fois dans le navigateur
  useEffect(() => {
    const r = lireReglages()
    reglagesRef.current = r
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReglages(r)
  }, [])

  const changerReglages = (changement: Partial<Reglages>) => {
    setReglages((r) => {
      const suivant = { ...r, ...changement }
      reglagesRef.current = suivant
      try {
        localStorage.setItem(CLE_REGLAGES, JSON.stringify(suivant))
      } catch {}
      return suivant
    })
  }

  // Jusqu'où le texte peut monter : la dernière ligne s'arrête sur la ligne de lecture
  const maximum = () => {
    const t = texte.current
    const e = ecran.current
    if (!t || !e) return 0
    return Math.max(0, t.offsetHeight - e.clientHeight * (1 - LIGNE) + 40)
  }

  // Applique la position directement à l'écran (aucun rendu React à chaque image)
  const afficher = useCallback(() => {
    const max = maximum()
    position.current = Math.min(Math.max(position.current, 0), max)
    if (texte.current) texte.current.style.transform = `translate3d(0, ${-position.current}px, 0)`
    if (barre.current) barre.current.style.transform = `scaleX(${max ? position.current / max : 0})`
    if (temps.current) {
      const reste = Math.ceil((max - position.current) / pixelsParSeconde(reglagesRef.current))
      temps.current.textContent = `${Math.floor(reste / 60)}:${String(reste % 60).padStart(2, '0')}`
    }
  }, [])

  // Le défilement : une boucle à chaque image, vitesse indépendante de l'écran (60 ou 120 Hz)
  useEffect(() => {
    let image = 0
    let precedent = performance.now()
    const boucle = (maintenant: number) => {
      const dt = Math.min((maintenant - precedent) / 1000, 0.1)
      precedent = maintenant
      if (enLecture.current && !glisse.current) {
        position.current += pixelsParSeconde(reglagesRef.current) * dt
        if (position.current >= maximum()) {
          enLecture.current = false
          setLecture(false)
          setFini(true)
          setControles(true)
        }
      }
      afficher()
      image = requestAnimationFrame(boucle)
    }
    image = requestAnimationFrame(boucle)
    const redimension = () => afficher()
    window.addEventListener('resize', redimension)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('resize', redimension)
    }
  }, [afficher])

  // Garder l'écran allumé pendant la lecture (si le téléphone le permet)
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    if (lecture && nav.wakeLock) {
      nav.wakeLock.request('screen').then((v) => (verrou.current = v)).catch(() => {})
    } else {
      verrou.current?.release().catch(() => {})
      verrou.current = null
    }
  }, [lecture])

  useEffect(() => () => void verrou.current?.release().catch(() => {}), [])

  // Pendant la lecture, les commandes s'effacent pour laisser toute la place au texte
  const montrerControles = useCallback(() => {
    setControles(true)
    clearTimeout(masquage.current)
    masquage.current = setTimeout(() => enLecture.current && setControles(false), 2500)
  }, [])

  // Décompte 3, 2, 1 avant le départ
  useEffect(() => {
    if (decompte === null) return
    if (decompte === 0) {
      enLecture.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLecture(true)
      setDecompte(null)
      montrerControles()
      return
    }
    vibrer(8)
    const suite = setTimeout(() => setDecompte((d) => (d === null ? null : d - 1)), 800)
    return () => clearTimeout(suite)
  }, [decompte, montrerControles])

  function basculer() {
    if (decompte !== null) return setDecompte(null)
    if (enLecture.current) {
      enLecture.current = false
      setLecture(false)
      setControles(true)
      clearTimeout(masquage.current)
      return
    }
    if (fini) {
      position.current = 0
      setFini(false)
    }
    setDecompte(3)
  }

  function recommencer() {
    enLecture.current = false
    setLecture(false)
    setFini(false)
    setDecompte(null)
    position.current = 0
    setControles(true)
  }

  function bravo(e: React.MouseEvent<HTMLElement>) {
    gerbe(e.currentTarget, true)
    vibrer(30)
  }

  async function basculerPleinEcran() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {}
  }

  useEffect(() => {
    const changement = () => setPleinEcran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', changement)
    return () => document.removeEventListener('fullscreenchange', changement)
  }, [])

  // Clavier : espace = lecture/pause, flèches = vitesse, Échap géré par le navigateur pour le plein écran
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        basculer()
      } else if (e.key === 'ArrowUp') {
        changerReglages({ vitesse: Math.min(VITESSE.max, reglagesRef.current.vitesse + 1) })
      } else if (e.key === 'ArrowDown') {
        changerReglages({ vitesse: Math.max(VITESSE.min, reglagesRef.current.vitesse - 1) })
      }
      montrerControles()
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  })

  // Lu après le chargement : le serveur ne sait pas si le téléphone accepte le plein écran (iPhone : non)
  const pleinEcranPossible = useSyncExternalStore(
    abonnementVide,
    () => !!document.documentElement.requestFullscreen,
    () => false
  )

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-nuit text-creme select-none">
      {/* Zone du texte : un toucher met en pause, un glissement fait avancer ou reculer */}
      <div
        ref={ecran}
        className="absolute inset-0 cursor-pointer touch-none"
        onPointerDown={(e) => {
          glisse.current = { y: e.clientY, depart: position.current }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!glisse.current) return
          position.current = glisse.current.depart - (e.clientY - glisse.current.y)
        }}
        onPointerUp={(e) => {
          const g = glisse.current
          glisse.current = null
          // Un simple toucher (sans glisser) : lecture ou pause
          if (g && Math.abs(e.clientY - g.y) < 8) basculer()
          montrerControles()
        }}
        onWheel={(e) => {
          position.current += e.deltaY
          montrerControles()
        }}
      >
        <div
          ref={texte}
          style={{ fontSize: reglages.taille, paddingTop: `${LIGNE * 100}vh` }}
          className="mx-auto max-w-[900px] px-[clamp(20px,6vw,64px)] pb-[70vh] will-change-transform"
        >
          <div className={reglages.miroir ? '-scale-x-100' : ''}>
            {fiche.hook && (
              <p className="mb-[1.2em] font-titre text-[1.08em] italic leading-[1.3] text-or">« {fiche.hook} »</p>
            )}
            {fiche.script.split(/\n{2,}/).map((paragraphe, i) => (
              <p key={i} className="mb-[0.9em] leading-[1.45] font-normal whitespace-pre-line">
                {mettreEnForme(paragraphe)}
              </p>
            ))}
            <p className="mt-[1.5em] text-center font-titre text-[0.8em] italic text-sur-bordeaux">Fin. Tu as été brillante.</p>
          </div>
        </div>
      </div>

      {/* Fondus haut et bas + ligne de lecture dorée */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[22vh] bg-linear-to-b from-nuit via-nuit/80 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh] bg-linear-to-t from-nuit via-nuit/85 to-transparent" />
      <div aria-hidden="true" style={{ top: `${LIGNE * 100}%` }} className="pointer-events-none absolute inset-x-0 flex items-center">
        <span className="size-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-or" />
        <span className="h-px flex-1 bg-or/35" />
        <span className="size-0 border-y-[7px] border-r-[10px] border-y-transparent border-r-or" />
      </div>

      {/* Haut : retour, titre, temps restant, progression */}
      <motion.div
        animate={{ opacity: controles ? 1 : 0, y: controles ? 0 : -16 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-x-0 top-0 px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] ${controles ? '' : 'pointer-events-none'}`}
      >
        <div className="mx-auto flex max-w-[900px] items-center gap-3">
          <Link
            href={`/sujets/${fiche.sujetId}`}
            aria-label="Revenir à la fiche"
            className="grid size-11 flex-none place-items-center rounded-full border border-creme/20 bg-creme/8 text-creme no-underline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-titre text-lg italic">{fiche.titre}</p>
            <p className="text-xs text-sur-bordeaux">
              Encore <span ref={temps}>0:00</span>
            </p>
          </div>
        </div>
        <div className="mx-auto mt-3 h-[3px] max-w-[900px] overflow-hidden rounded-full bg-creme/12">
          <div ref={barre} className="h-full origin-left scale-x-0 rounded-full bg-or" />
        </div>
      </motion.div>

      {/* Bas : les commandes */}
      <motion.div
        animate={{ opacity: controles ? 1 : 0, y: controles ? 0 : 24 }}
        transition={{ duration: 0.3 }}
        className={`absolute inset-x-0 bottom-0 px-3 pb-[calc(14px+env(safe-area-inset-bottom,0px))] ${controles ? '' : 'pointer-events-none'}`}
      >
        <div className="mx-auto flex max-w-[640px] flex-wrap items-center justify-center gap-2 rounded-[26px] border border-creme/15 bg-creme/8 p-2.5 backdrop-blur-[18px]">
          <Reglage
            libelle="Vitesse"
            valeur={reglages.vitesse}
            moins={() => changerReglages({ vitesse: Math.max(VITESSE.min, reglages.vitesse - 1) })}
            plus={() => changerReglages({ vitesse: Math.min(VITESSE.max, reglages.vitesse + 1) })}
          />
          <button
            type="button"
            onClick={basculer}
            aria-label={lecture || decompte !== null ? 'Mettre en pause' : fini ? 'Relire depuis le début' : 'Lancer la lecture'}
            className="grid size-16 place-items-center rounded-full bg-or text-bordeaux-profond shadow-or transition-transform active:scale-95"
          >
            {lecture || decompte !== null ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="translate-x-0.5">
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
              </svg>
            )}
          </button>
          <Reglage
            libelle="Taille"
            valeur={reglages.taille}
            moins={() => changerReglages({ taille: Math.max(TAILLE.min, reglages.taille - TAILLE.pas) })}
            plus={() => changerReglages({ taille: Math.min(TAILLE.max, reglages.taille + TAILLE.pas) })}
          />
          <div className="flex w-full justify-center gap-2 tablette:w-auto">
            <Interrupteur libelle="Recommencer" onClick={recommencer}>
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </Interrupteur>
            <Interrupteur libelle="Miroir" actif={reglages.miroir} onClick={() => changerReglages({ miroir: !reglages.miroir })}>
              <path d="M12 3v18" />
              <path d="M8 7 4 12l4 5V7zM16 7l4 5-4 5V7z" />
            </Interrupteur>
            {pleinEcranPossible && (
              <Interrupteur libelle={pleinEcran ? 'Quitter le plein écran' : 'Plein écran'} actif={pleinEcran} onClick={basculerPleinEcran}>
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </Interrupteur>
            )}
          </div>
        </div>
      </motion.div>

      {/* Décompte */}
      <AnimatePresence>
        {decompte !== null && decompte > 0 && (
          <motion.div
            key={decompte}
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.45, ease: COURBES.expo }}
            aria-live="assertive"
            className="pointer-events-none absolute inset-0 grid place-items-center font-titre text-[clamp(120px,40vw,260px)] italic text-or"
          >
            {decompte}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fin du script */}
      <AnimatePresence>
        {fini && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: COURBES.power3 }}
            className="absolute inset-x-4 top-[calc(76px+env(safe-area-inset-top,0px))] mx-auto max-w-[420px] rounded-[24px] border border-or/30 bg-nuit/90 p-5 text-center backdrop-blur-md"
          >
            <p className="font-titre text-[26px] italic">C’est dans la boîte ?</p>
            <p className="mt-1 text-sm text-sur-bordeaux">Si oui, tu peux être fière de toi.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={recommencer}
                className="min-h-12 flex-1 rounded-[16px] border border-creme/30 text-sm font-semibold"
              >
                Une autre prise
              </button>
              <Link
                href={`/sujets/${fiche.sujetId}`}
                onClick={bravo}
                className="flex min-h-12 flex-[1.3] items-center justify-center rounded-[16px] bg-or text-sm font-semibold text-bordeaux-profond no-underline"
              >
                Oui, c’est fait !
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const abonnementVide = () => () => {}

function Reglage({ libelle, valeur, moins, plus }: { libelle: string; valeur: number; moins: () => void; plus: () => void }) {
  const bouton = 'grid size-11 place-items-center rounded-full text-xl text-creme transition-colors hover:bg-creme/10 active:scale-95'
  return (
    <div role="group" aria-label={libelle} className="flex items-center gap-0.5 rounded-full bg-creme/6 px-1">
      <button type="button" onClick={moins} aria-label={`${libelle} : moins`} className={bouton}>
        −
      </button>
      <div className="min-w-12 text-center leading-tight">
        <span className="block text-[10px] uppercase tracking-[0.14em] text-sur-bordeaux">{libelle}</span>
        <span aria-live="polite" className="font-titre text-lg">
          {valeur}
        </span>
      </div>
      <button type="button" onClick={plus} aria-label={`${libelle} : plus`} className={bouton}>
        +
      </button>
    </div>
  )
}

function Interrupteur({ libelle, actif = false, onClick, children }: { libelle: string; actif?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      aria-pressed={actif}
      title={libelle}
      className={`grid size-11 place-items-center rounded-full transition-colors active:scale-95 ${actif ? 'bg-or text-bordeaux-profond' : 'bg-creme/6 text-creme hover:bg-creme/12'}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
