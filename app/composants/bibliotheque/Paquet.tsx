'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { gerbe, vibrer } from '@/lib/confettis'
import { NOMS_PILIERS, nomFormat } from '@/lib/contenu'
import { prendreSujet } from '@/app/actions'
import { NumeroFiligrane } from '../ui/Carte'
import { useToast } from '../ui/Toast'
import { ART } from '../accueil/Suggestions'
import type { SujetBiblio, ThemeBiblio } from './Bibliotheque'

type Tirage = { sujet: SujetBiblio; theme: ThemeBiblio | null }

type Props = {
  // Sujets que le hasard peut proposer (déjà publiés et déjà planifiés exclus)
  tirables: Tirage[]
  modifier: (id: string, changement: Partial<SujetBiblio>) => void
  surFermer: () => void
}

const NOMBRE_CARTES = 5

// « Surprends-moi » : le paquet arrive, se mélange trois fois, puis la carte du dessus se retourne.
// Chorégraphie reprise de la timeline GSAP de bibliotheque.html.
export default function Paquet({ tirables, modifier, surFermer }: Props) {
  const toast = useToast()
  const voile = useRef<HTMLDivElement>(null)
  const cartes = useRef<(HTMLDivElement | null)[]>([])
  const interieurDessus = useRef<HTMLDivElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const boutonPrendre = useRef<HTMLButtonElement>(null)
  const occupe = useRef(true)
  const dernier = useRef<string | null>(null)
  const [indice, setIndice] = useState('Je mélange…')
  const [tirage, setTirage] = useState<Tirage | null>(null)
  const reduit = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function piocher(): Tirage | null {
    if (tirables.length === 0) return null
    let choix: Tirage
    let essais = 0
    do {
      choix = tirables[Math.floor(Math.random() * tirables.length)]
      essais++
    } while (tirables.length > 1 && choix.sujet.id === dernier.current && essais < 12)
    dernier.current = choix.sujet.id
    return choix
  }

  const toutes = () => cartes.current.filter((c): c is HTMLDivElement => !!c)
  const dessus = () => toutes()[NOMBRE_CARTES - 1]

  function melanger(tl: gsap.core.Timeline) {
    const liste = toutes()
    for (let k = 0; k < 3; k++) {
      tl.to(liste.filter((_, i) => i % 2 === 0), { x: -118, rotation: -14, y: -6, duration: 0.2, ease: 'power2.out' })
        .to(liste.filter((_, i) => i % 2 === 1), { x: 118, rotation: 14, y: 6, duration: 0.2, ease: 'power2.out' }, '<')
        .add(() => liste.forEach((c, i) => (c.style.zIndex = String(((i + k) % 2 ? 10 : 20) + i))))
        .to(liste, { x: 0, y: 0, rotation: (i: number) => (i - 2) * 2.5, duration: 0.2, ease: 'power2.in' })
    }
    tl.add(() => {
      liste.forEach((c, i) => (c.style.zIndex = String(10 + i)))
      dessus().style.zIndex = '60'
    })
  }

  function reveler(tl: gsap.core.Timeline) {
    const choix = piocher()
    tl.add(() => {
      setTirage(choix)
      setIndice('Et ton sujet est…')
    })
      .to(dessus(), { y: -12, scale: 1.05, rotation: 0, duration: 0.3, ease: 'power2.out' })
      .to(interieurDessus.current, { rotateY: 180, duration: 0.85, ease: 'back.out(1.3)' })
      .add(() => {
        setIndice('Le hasard a bien choisi.')
        gerbe(dessus())
        vibrer(20)
      }, '-=.35')
      .to(actions.current, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=.2')
      .add(() => {
        occupe.current = false
        boutonPrendre.current?.focus({ preventScroll: true })
      })
  }

  // Ouverture
  useLayoutEffect(() => {
    document.body.style.overflow = 'hidden'
    const ctx = gsap.context(() => {
      if (reduit) {
        setTirage(piocher())
        setIndice('Et ton sujet est…')
        gsap.set(interieurDessus.current, { rotateY: 180 })
        gsap.set(actions.current, { autoAlpha: 1, y: 0 })
        occupe.current = false
        return
      }
      const liste = toutes()
      gsap.set(interieurDessus.current, { rotateY: 0 })
      gsap.set(actions.current, { autoAlpha: 0, y: 20 })
      gsap.set(liste, { x: 0, y: window.innerHeight * 0.6, scale: 1, opacity: 0, rotation: (i: number) => (i - 2) * 6 })
      const tl = gsap.timeline()
      tl.fromTo(voile.current, { opacity: 0 }, { opacity: 1, duration: 0.3 }).to(
        liste,
        { y: 0, opacity: 1, rotation: (i: number) => (i - 2) * 2.5, stagger: 0.06, duration: 0.6, ease: 'back.out(1.4)' },
        '-=.1'
      )
      melanger(tl)
      reveler(tl)
    }, voile)
    return () => {
      ctx.revert()
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && !occupe.current && fermer()
    document.addEventListener('keydown', echap)
    return () => document.removeEventListener('keydown', echap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function fermer() {
    occupe.current = true
    if (reduit) return surFermer()
    gsap.to(voile.current, { opacity: 0, duration: 0.3, onComplete: surFermer })
  }

  function encore() {
    if (occupe.current) return
    if (reduit) {
      setTirage(piocher())
      return
    }
    occupe.current = true
    setIndice('Je remélange…')
    const tl = gsap.timeline()
    tl.to(actions.current, { autoAlpha: 0, y: 20, duration: 0.25 })
      .to(interieurDessus.current, { rotateY: 0, duration: 0.5, ease: 'power2.inOut' }, '<')
      .to(dessus(), { y: 0, scale: 1, duration: 0.3 }, '<')
    melanger(tl)
    reveler(tl)
  }

  async function prendre() {
    if (occupe.current || !tirage) return
    occupe.current = true
    const { sujet } = tirage
    gerbe(dessus(), true)
    vibrer(30)
    modifier(sujet.id, { planifie: true })
    const message = `« ${sujet.titre} » ajouté à ton planning`
    prendreSujet(sujet.id).then(({ ok }) => {
      if (!ok) {
        modifier(sujet.id, { planifie: false })
        toast('Ce sujet n’a pas pu rejoindre ton planning. Réessaie.', 'erreur')
      }
    })
    if (reduit) {
      toast(message)
      return surFermer()
    }
    gsap
      .timeline()
      .to(actions.current, { autoAlpha: 0, duration: 0.2 })
      .to(dessus(), { y: -window.innerHeight * 0.7, rotation: 10, scale: 0.4, opacity: 0, duration: 0.7, ease: 'power3.in' }, '<.1')
      .to(toutes().slice(0, -1), { opacity: 0, y: 60, stagger: 0.04, duration: 0.3 }, '<')
      .add(() => {
        toast(message)
        fermer()
      })
  }

  const pilier = tirage?.theme?.pilier ?? 'soin'

  return (
    <div
      ref={voile}
      role="dialog"
      aria-modal="true"
      aria-label="Sujet tiré au sort"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-[26px] bg-voile px-5 pt-[calc(20px+env(safe-area-inset-top,0px))] pb-[calc(20px+env(safe-area-inset-bottom,0px))] backdrop-blur-md [@media(max-height:560px)]:gap-3"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => !occupe.current && fermer()}
        className="absolute top-[calc(14px+env(safe-area-inset-top,0px))] right-4 grid size-12 place-items-center rounded-full border border-creme/20 bg-creme/8 text-creme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <p aria-live="polite" className="min-h-5 text-sm tracking-[0.04em] text-sur-bordeaux">
        {indice}
      </p>

      <div className="relative aspect-[3/4.1] w-[min(300px,74vw,calc((100dvh-230px)*0.73))] min-w-[170px] perspective-[1300px]">
        {Array.from({ length: NOMBRE_CARTES }, (_, i) => {
          const estDessus = i === NOMBRE_CARTES - 1
          return (
            <div key={i} ref={(el) => void (cartes.current[i] = el)} className="absolute inset-0">
              <div ref={estDessus ? interieurDessus : undefined} className="relative size-full [transform-style:preserve-3d]">
                <DosDeCarte />
                {estDessus && (
                  <div
                    aria-hidden={!tirage}
                    className={`grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[26px] p-6 shadow-paquet [backface-visibility:hidden] [transform:rotateY(180deg)] [@media(max-height:560px)]:p-4 ${ART[pilier]}`}
                  >
                    {tirage && (
                      <>
                        <NumeroFiligrane numero={tirage.theme?.numero ?? '—'} className="-right-1 -bottom-10 text-[200px]" />
                        <div className="relative z-[2]">
                          <p className="surtitre tracking-[0.14em] text-(--sub)">Ton sujet du jour</p>
                          <p className="mt-1.5 text-[13px] text-(--sub)">
                            {tirage.theme ? `${NOMS_PILIERS[tirage.theme.pilier]} · ${tirage.theme.nom}` : 'Idée à ranger'}
                          </p>
                        </div>
                        <h3 className="relative z-[2] font-titre text-[clamp(26px,7vw,33px)] font-medium leading-[1.08] [@media(max-height:560px)]:text-[22px]">
                          {tirage.sujet.titre}
                        </h3>
                        {nomFormat(tirage.sujet.format) ? (
                          <span className="relative z-[2] self-start rounded-full bg-(--chip) px-3 py-[7px] text-xs font-semibold">
                            {nomFormat(tirage.sujet.format)}
                          </span>
                        ) : (
                          <span />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {tirables.length === 0 && (
          <p className="absolute inset-x-0 -bottom-16 text-center text-sm text-sur-bordeaux">
            Ta banque est vide pour l’instant : ajoute des idées, puis reviens me voir.
          </p>
        )}
      </div>

      <div ref={actions} className="invisible flex w-[min(340px,100%)] gap-2.5 opacity-0">
        <button
          type="button"
          onClick={encore}
          className="min-h-14 flex-1 rounded-[18px] border border-creme/35 bg-transparent text-[15px] font-semibold text-creme transition-transform duration-200 active:scale-[0.96]"
        >
          Tirer une autre
        </button>
        <button
          ref={boutonPrendre}
          type="button"
          onClick={prendre}
          disabled={!tirage}
          className="min-h-14 flex-[1.25] rounded-[18px] bg-or text-[15px] font-semibold text-bordeaux-profond transition-transform duration-200 active:scale-[0.96]"
        >
          Je le prends
        </button>
      </div>
    </div>
  )
}

// Le dos des cartes : cadre léopard doré, panneau bordeaux, liseré d'or, « M » en italique
function DosDeCarte() {
  return (
    <div className="grain absolute inset-0 grid place-items-center overflow-hidden rounded-[26px] shadow-paquet [backface-visibility:hidden]">
      <span className="absolute inset-0 z-0 bg-bordeaux-nuit bg-(image:--leo-or) bg-size-[110px_110px]" />
      <span className="fond-rubis absolute inset-[11px] z-0 rounded-[18px] shadow-lisere-or" />
      <span className="absolute inset-5 z-[1] rounded-[18px] border border-or/35" />
      <span className="relative z-[2] font-titre text-[84px] font-normal italic leading-none text-or">M</span>
      <span className="absolute inset-x-0 bottom-[30px] z-[2] text-center text-[11px] uppercase tracking-[0.24em] text-sur-bordeaux">
        Manuella Content
      </span>
    </div>
  )
}
