'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { ART, NOMS_PILIERS, type Pilier } from '@/lib/contenu'
import Avatar from '../ui/Avatar'
import Compteur from '../ui/Compteur'
import Lettres from '../ui/Lettres'
import RubanLeopard from '../ui/RubanLeopard'

export type DonneesBilan = {
  nom: string
  photo: string
  periode: string
  publies: { titre: string; pilier: Pilier }[]
  ideesAjoutees: number
  fichesCreees: number
  piliers: Record<Pilier, number>
  reseaux: { nom: string; plateforme: string; abonnes: number; gain: number | null }[]
  serie: number
  semaineActive: { jour: string; actif: boolean; futur: boolean }[]
  anglais: { niveau: string; mois: string } | null
  motDeFin: string
}

// Durée d'un écran de la story
const DUREE = 6000
const FORMAT = new Intl.NumberFormat('fr-FR')

export default function Bilan({ donnees }: { donnees: DonneesBilan }) {
  const ecrans = construireEcrans(donnees)
  const [rang, setRang] = useState(0)
  const [pause, setPause] = useState(false)
  const barres = useRef<(HTMLSpanElement | null)[]>([])
  const ecoule = useRef(0)
  const appui = useRef<{ x: number; temps: number; maintenu: boolean } | null>(null)
  const maintien = useRef<ReturnType<typeof setTimeout>>(undefined)
  const dernier = rang === ecrans.length - 1

  const aller = useCallback(
    (suivant: number) => {
      const borne = Math.max(0, Math.min(ecrans.length - 1, suivant))
      ecoule.current = 0
      setRang(borne)
      vibrer(5)
    },
    [ecrans.length]
  )

  // Avance automatique : la barre de l'écran en cours se remplit, puis on passe au suivant
  useEffect(() => {
    let image = 0
    let precedent = performance.now()
    const boucle = (maintenant: number) => {
      const dt = maintenant - precedent
      precedent = maintenant
      if (!pause && !dernier) ecoule.current += dt
      barres.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleX(${i < rang ? 1 : i > rang ? 0 : dernier ? 1 : Math.min(1, ecoule.current / DUREE)})`
      })
      if (ecoule.current >= DUREE && !dernier) aller(rang + 1)
      else image = requestAnimationFrame(boucle)
    }
    image = requestAnimationFrame(boucle)
    return () => cancelAnimationFrame(image)
  }, [rang, pause, dernier, aller])

  // Clavier : flèches pour naviguer, espace pour mettre en pause
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') aller(rang + 1)
      else if (e.key === 'ArrowLeft') aller(rang - 1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPause((p) => !p)
      }
    }
    document.addEventListener('keydown', touche)
    return () => document.removeEventListener('keydown', touche)
  }, [rang, aller])

  // Confettis sur le mot de fin
  useEffect(() => {
    if (dernier) {
      const t = setTimeout(() => gerbe(null, true), 500)
      return () => clearTimeout(t)
    }
  }, [dernier])

  return (
    <div className="fond-rubis grain fixed inset-0 z-[60] overflow-hidden text-creme select-none">
      {/* Barres de progression + fermer */}
      <div className="absolute inset-x-0 top-0 z-[5] px-3 pt-[calc(10px+env(safe-area-inset-top,0px))]">
        <div className="mx-auto flex max-w-[560px] gap-1">
          {ecrans.map((e, i) => (
            <span key={e.cle} className="h-[3px] flex-1 overflow-hidden rounded-full bg-creme/25">
              <span ref={(el) => void (barres.current[i] = el)} className="block h-full origin-left scale-x-0 rounded-full bg-or" />
            </span>
          ))}
        </div>
        <div className="mx-auto mt-3 flex max-w-[560px] items-center gap-2.5">
          <Avatar src={donnees.photo} taille={34} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-semibold">Ton bilan</p>
            <p className="truncate text-xs text-sur-bordeaux">Semaine {donnees.periode}</p>
          </div>
          {pause && <span className="text-xs text-sur-bordeaux">En pause</span>}
          <Link
            href="/"
            aria-label="Fermer le bilan"
            className="grid size-11 place-items-center rounded-full text-creme no-underline hover:bg-creme/10 hover:text-creme"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Zone de toucher : gauche = précédent, droite = suivant, appui long = pause */}
      <div
        className="absolute inset-0 z-[1]"
        onPointerDown={(e) => {
          appui.current = { x: e.clientX, temps: Date.now(), maintenu: false }
          maintien.current = setTimeout(() => {
            if (appui.current) appui.current.maintenu = true
            setPause(true)
          }, 200)
        }}
        onPointerUp={(e) => {
          clearTimeout(maintien.current)
          const a = appui.current
          appui.current = null
          if (!a) return
          if (a.maintenu) return setPause(false)
          if (dernier && e.clientX > window.innerWidth * 0.3) return
          aller(e.clientX < window.innerWidth * 0.3 ? rang - 1 : rang + 1)
        }}
        onPointerLeave={() => {
          clearTimeout(maintien.current)
          if (appui.current?.maintenu) setPause(false)
          appui.current = null
        }}
      />

      <AnimatePresence mode="wait">
        <motion.section
          key={ecrans[rang].cle}
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease: COURBES.power3 }}
          className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center px-6 pt-[calc(90px+env(safe-area-inset-top,0px))] pb-[calc(40px+env(safe-area-inset-bottom,0px))] text-center"
        >
          <div className="w-full max-w-[520px]">{ecrans[rang].contenu}</div>
        </motion.section>
      </AnimatePresence>

      <p className="sr-only">Touche la droite de l’écran pour avancer, la gauche pour revenir. Reste appuyée pour mettre en pause.</p>
    </div>
  )
}

// Un élément qui arrive à son tour dans l'écran
function Bloc({ rang = 0, children, className = '' }: { rang?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + rang * 0.12, duration: 0.6, ease: COURBES.power3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const Surtitre = ({ children }: { children: ReactNode }) => (
  <p className="text-xs uppercase tracking-[0.24em] text-sur-bordeaux">{children}</p>
)
const GrandChiffre = ({ valeur }: { valeur: number }) => (
  <p className="mt-2 font-titre text-[clamp(96px,32vw,180px)] font-normal italic leading-[0.9] text-or">
    <Compteur valeur={valeur} duree={1.2} />
  </p>
)

function construireEcrans(d: DonneesBilan) {
  const ecrans: { cle: string; contenu: ReactNode }[] = []
  const totalPiliers = d.piliers.soin + d.piliers.mental + d.piliers.evoluer

  ecrans.push({
    cle: 'intro',
    contenu: (
      <>
        <Bloc className="flex justify-center">
          <Avatar src={d.photo} taille={110} />
        </Bloc>
        <Bloc rang={1}>
          <p className="mt-6 text-sm uppercase tracking-[0.28em] text-sur-bordeaux">Ta semaine,</p>
        </Bloc>
        <h1 className="mt-1 font-titre text-[clamp(48px,16vw,104px)] font-normal italic leading-[0.95] text-or">
          <Lettres texte={d.nom} delai={0.35} ecart={0.05} duree={0.8} />
        </h1>
        <Bloc rang={3}>
          <p className="mt-3 text-[17px] font-light text-sur-bordeaux-clair">Semaine {d.periode}. On regarde ensemble ?</p>
          <RubanLeopard centre className="mt-5" />
        </Bloc>
      </>
    ),
  })

  ecrans.push({
    cle: 'publies',
    contenu: (
      <>
        <Bloc>
          <Surtitre>Cette semaine, tu as publié</Surtitre>
        </Bloc>
        <Bloc rang={1}>
          <GrandChiffre valeur={d.publies.length} />
          <p className="font-titre text-2xl italic">{d.publies.length > 1 ? 'contenus' : 'contenu'}</p>
        </Bloc>
        {d.publies.length > 0 ? (
          <Bloc rang={2} className="mt-6 flex flex-col gap-2">
            {d.publies.slice(0, 4).map((p, i) => (
              <p key={i} className={`grain relative rounded-[16px] px-4 py-3 text-left font-titre text-lg leading-tight ${ART[p.pilier]}`}>
                <span className="relative z-[2]">{p.titre}</span>
              </p>
            ))}
            {d.publies.length > 4 && <p className="text-sm text-sur-bordeaux">et {d.publies.length - 4} autre{d.publies.length - 4 > 1 ? 's' : ''}</p>}
          </Bloc>
        ) : (
          <Bloc rang={2}>
            <p className="mt-5 text-[17px] text-sur-bordeaux-clair">Pas de publication cette semaine, et c’est ok. Le principal, c’est de revenir.</p>
          </Bloc>
        )}
      </>
    ),
  })

  ecrans.push({
    cle: 'prepare',
    contenu: (
      <>
        <Bloc>
          <Surtitre>Dans les coulisses</Surtitre>
        </Bloc>
        <Bloc rang={1} className="mt-6 grid grid-cols-2 gap-3">
          {[
            { valeur: d.ideesAjoutees, texte: d.ideesAjoutees > 1 ? 'idées notées' : 'idée notée' },
            { valeur: d.fichesCreees, texte: d.fichesCreees > 1 ? 'fiches préparées' : 'fiche préparée' },
          ].map((c) => (
            <div key={c.texte} className="rounded-[24px] border border-creme/15 bg-creme/8 p-5">
              <p className="font-titre text-[64px] italic leading-none text-or">
                <Compteur valeur={c.valeur} duree={1} />
              </p>
              <p className="mt-2 text-sm text-sur-bordeaux-clair">{c.texte}</p>
            </div>
          ))}
        </Bloc>
        <Bloc rang={2}>
          <p className="mt-6 font-titre text-2xl italic leading-snug">
            {d.ideesAjoutees + d.fichesCreees > 0 ? 'Tout ce travail invisible, c’est lui qui fait la différence.' : 'Une idée suffit pour relancer la machine. Note-la dès qu’elle arrive.'}
          </p>
        </Bloc>
      </>
    ),
  })

  if (totalPiliers > 0) {
    ecrans.push({
      cle: 'piliers',
      contenu: (
        <>
          <Bloc>
            <Surtitre>L’équilibre de ta semaine</Surtitre>
          </Bloc>
          <Bloc rang={1} className="mt-6 flex flex-col gap-3 text-left">
            {(Object.keys(d.piliers) as Pilier[]).map((p, i) => {
              const part = d.piliers[p] / totalPiliers
              return (
                <div key={p}>
                  <div className="flex justify-between text-sm">
                    <span>{NOMS_PILIERS[p]}</span>
                    <span className="text-sur-bordeaux">{d.piliers[p]}</span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-creme/12">
                    <motion.div
                      className={`h-full rounded-full ${ART[p]}`}
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.max(part * 100, d.piliers[p] ? 6 : 0)}%` }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 1, ease: COURBES.power3 }}
                    />
                  </div>
                </div>
              )
            })}
          </Bloc>
          <Bloc rang={2}>
            <p className="mt-6 font-titre text-2xl italic leading-snug">
              {Object.values(d.piliers).every((v) => v > 0)
                ? 'Les trois piliers sont là. Dehors comme dedans, tu prends soin de toutes.'
                : `Et si la semaine prochaine faisait un peu plus de place à « ${NOMS_PILIERS[(Object.keys(d.piliers) as Pilier[]).find((p) => d.piliers[p] === 0)!]} » ?`}
            </p>
          </Bloc>
        </>
      ),
    })
  }

  if (d.reseaux.length > 0) {
    ecrans.push({
      cle: 'abonnes',
      contenu: (
        <>
          <Bloc>
            <Surtitre>Ta communauté grandit</Surtitre>
          </Bloc>
          <Bloc rang={1} className="mt-6 flex flex-col gap-3">
            {d.reseaux.map((r) => (
              <div key={r.plateforme} className="flex items-center justify-between rounded-[20px] border border-creme/15 bg-creme/8 px-5 py-4 text-left">
                <div>
                  <p className="text-sm text-sur-bordeaux">{r.nom}</p>
                  <p className="font-titre text-3xl italic">{FORMAT.format(r.abonnes)}</p>
                </div>
                <p className="font-titre text-2xl italic text-or">
                  {r.gain === null ? '—' : r.gain >= 0 ? `+${FORMAT.format(r.gain)}` : FORMAT.format(r.gain)}
                </p>
              </div>
            ))}
          </Bloc>
          <Bloc rang={2}>
            <p className="mt-6 text-[15px] text-sur-bordeaux-clair">
              {d.reseaux.some((r) => r.gain === null)
                ? 'Mets tes abonnés à jour dans ton profil chaque semaine pour voir ta progression ici.'
                : 'Chaque nouvelle abonnée, c’est quelqu’un qui a choisi de grandir avec toi.'}
            </p>
          </Bloc>
        </>
      ),
    })
  }

  ecrans.push({
    cle: 'serie',
    contenu: (
      <>
        <Bloc>
          <Surtitre>Ta série</Surtitre>
        </Bloc>
        <Bloc rang={1}>
          <p className="mt-2 inline-block origin-[50%_90%] animate-flamme text-6xl" aria-hidden="true">
            🔥
          </p>
          <GrandChiffre valeur={d.serie} />
          <p className="font-titre text-2xl italic">{d.serie > 1 ? 'jours d’affilée' : 'jour d’affilée'}</p>
        </Bloc>
        <Bloc rang={2} className="mt-6 flex justify-center gap-2">
          {d.semaineActive.map((j, i) => (
            <div key={j.jour} className="flex flex-col items-center gap-1.5">
              <span
                className={`grid size-9 place-items-center rounded-full border ${
                  j.actif ? 'border-or bg-or text-bordeaux-profond' : j.futur ? 'border-creme/15' : 'border-creme/30'
                }`}
              >
                {j.actif && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="text-[11px] uppercase text-sur-bordeaux">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
            </div>
          ))}
        </Bloc>
      </>
    ),
  })

  if (d.anglais) {
    ecrans.push({
      cle: 'anglais',
      contenu: (
        <>
          <Bloc>
            <Surtitre>Ton anglais</Surtitre>
          </Bloc>
          <Bloc rang={1}>
            <p className="mt-4 font-titre text-[clamp(80px,26vw,150px)] italic leading-none text-or">{d.anglais.niveau}</p>
            {d.anglais.mois && <p className="mt-2 text-sm text-sur-bordeaux">au dernier point d’étape ({d.anglais.mois})</p>}
          </Bloc>
          <Bloc rang={2}>
            <p className="mt-6 font-titre text-2xl italic leading-snug">Step by step, tu deviens bilingue. Keep going, sis.</p>
          </Bloc>
        </>
      ),
    })
  }

  ecrans.push({
    cle: 'fin',
    contenu: (
      <>
        <Bloc>
          <span aria-hidden="true" className="font-titre text-[80px] leading-[0.6] text-or">
            “
          </span>
        </Bloc>
        <Bloc rang={1}>
          <p className="font-titre text-[clamp(26px,7vw,36px)] italic leading-[1.25]">{d.motDeFin}</p>
        </Bloc>
        <Bloc rang={2}>
          <p className="mt-5 text-sm uppercase tracking-[0.24em] text-sur-bordeaux">Ta grande sœur</p>
        </Bloc>
        <Bloc rang={3} className="pointer-events-auto mt-8 flex flex-col gap-2.5">
          <Link
            href="/planning"
            className="flex min-h-14 items-center justify-center rounded-[18px] bg-or font-semibold text-bordeaux-profond no-underline hover:text-bordeaux-profond"
          >
            Préparer la semaine prochaine
          </Link>
          <Link href="/" className="flex min-h-12 items-center justify-center rounded-[18px] border border-creme/35 font-semibold text-creme no-underline hover:text-creme">
            Retour à l’accueil
          </Link>
        </Bloc>
      </>
    ),
  })

  return ecrans
}
