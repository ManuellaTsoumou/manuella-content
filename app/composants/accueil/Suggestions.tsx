'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { NOMS_PILIERS, nomFormat } from '@/lib/contenu'
import type { SujetCandidat } from '@/lib/suggestions'
import { prendreSujet } from '@/app/actions'
import { NumeroFiligrane } from '../ui/Carte'
import { useToast } from '../ui/Toast'
import { ARRIVEE, TeteDeSection } from './Accueil'

// back.out(1.6) de GSAP
const RETOUR = [0.34, 1.6, 0.64, 1] as const

// Palette tonale de chaque pilier (classes écrites en entier pour que Tailwind les trouve)
export const ART = { soin: 'art-soin', mental: 'art-mental', evoluer: 'art-evoluer' } as const

type Props = {
  suggestions: SujetCandidat[]
  surPrise: (sujet: SujetCandidat) => void
}

export default function Suggestions({ suggestions, surPrise }: Props) {
  // Les 3 cartes affichées, puis la réserve pour « Pas aujourd'hui »
  const [cartes, setCartes] = useState(() => suggestions.slice(0, 3))
  const reserve = useRef(suggestions.slice(3))

  function passer(index: number) {
    vibrer(8)
    const suivant = reserve.current.shift()
    if (!suivant) return false
    setCartes((c) => c.map((s, i) => (i === index ? suivant : s)))
    return true
  }

  return (
    <section>
      <TeteDeSection titre="Ta suggestion du jour" rang={0}>
        3 idées choisies pour toi
      </TeteDeSection>

      {cartes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ARRIVEE.sections, duration: 0.6 }}
          className="rounded-carte border border-ligne bg-surface px-5 py-8 text-center"
        >
          <p className="font-titre text-[26px] font-medium italic">Ta banque attend tes idées</p>
          <p className="mt-2 text-texte-doux">Tout est déjà planifié ou traité. Ajoute de nouveaux sujets, je m’occupe du reste.</p>
          <Link href="/sujets" className="mt-4 inline-flex min-h-11 items-center font-medium">
            Ouvrir ma Bibliothèque
          </Link>
        </motion.div>
      ) : (
        <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[min(78%,320px)] grid-flow-col gap-3 overflow-x-auto px-4 pt-1 pb-3.5 [scrollbar-width:none] carte:m-0 carte:grid-flow-row carte:auto-cols-auto carte:grid-cols-3 carte:overflow-visible carte:p-0 bureau:grid-cols-1 [&::-webkit-scrollbar]:hidden">
          {cartes.map((sujet, i) => (
            <CarteSuggestion key={i} sujet={sujet} rang={i} surPasser={() => passer(i)} surPrise={surPrise} />
          ))}
        </div>
      )}
    </section>
  )
}

function CarteSuggestion({
  sujet,
  rang,
  surPasser,
  surPrise,
}: {
  sujet: SujetCandidat
  rang: number
  surPasser: () => boolean
  surPrise: (sujet: SujetCandidat) => void
}) {
  const toast = useToast()
  const carte = useRef<HTMLElement>(null)
  const [prise, setPrise] = useState(false)
  const [premiere, setPremiere] = useState(true)
  const pilier = sujet.pilier ?? 'soin'
  const format = nomFormat(sujet.format)

  async function prendre() {
    setPrise(true)
    gerbe(carte.current)
    vibrer(25)
    toast(`« ${sujet.titre} » ajouté à ton planning`)
    surPrise(sujet)
    const { ok } = await prendreSujet(sujet.id)
    if (!ok) {
      setPrise(false)
      toast('Ce sujet n’a pas pu rejoindre ton planning. Réessaie.', 'erreur')
    }
  }

  function passer() {
    setPremiere(false)
    if (!surPasser()) toast('Tu as vu toutes mes idées du jour. Ajoute-en dans ta Bibliothèque !', 'info')
  }

  return (
    <div className="snap-start">
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          ref={carte}
          key={sujet.id}
          initial={premiere ? { opacity: 0, y: 30 } : { x: 60, rotate: 6, opacity: 0 }}
          animate={{
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            transition: premiere
              ? { delay: ARRIVEE.sections + 0.05 + rang * 0.05, duration: 0.6, ease: COURBES.power3 }
              : { duration: 0.55, ease: RETOUR },
          }}
          exit={{ x: -140, rotate: -10, opacity: 0, transition: { duration: 0.35, ease: COURBES.entree } }}
          className={`grain relative flex h-full min-h-[250px] flex-col justify-between gap-4 overflow-hidden rounded-carte p-5 bureau:min-h-0 ${ART[pilier]}`}
        >
          <NumeroFiligrane numero={sujet.numero} className="-right-1.5 -bottom-[34px] text-[150px]" />
          <div className="relative z-[2]">
            <p className="surtitre text-(--sub)">
              {NOMS_PILIERS[pilier]}
              {sujet.theme ? ` · ${sujet.theme}` : ''}
            </p>
            <h3 className="mt-1.5 font-titre text-[clamp(23px,6.4vw,27px)] font-medium leading-[1.1]">{sujet.titre}</h3>
          </div>
          {format && (
            <div className="relative z-[2] flex flex-wrap gap-2">
              <span className="rounded-full bg-(--chip) px-[11px] py-1.5 text-xs">{format}</span>
            </div>
          )}
          {prise ? (
            <motion.p
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 2.5, 0.64, 1] }}
              className="relative z-[2] flex origin-left items-center gap-2.5 font-medium"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Planifié pour aujourd’hui
            </motion.p>
          ) : (
            <div className="relative z-[2] flex gap-2">
              <button
                type="button"
                onClick={passer}
                className="min-h-[46px] flex-1 rounded-petit border border-(--line-c) bg-transparent text-sm font-medium transition-transform duration-200 active:scale-[0.96]"
              >
                Pas aujourd’hui
              </button>
              <button
                type="button"
                onClick={prendre}
                className="min-h-[46px] flex-[1.3] rounded-petit bg-(--btn) text-sm font-semibold text-(--btn-ink) transition-transform duration-200 active:scale-[0.96]"
              >
                Je le prends
              </button>
            </div>
          )}
        </motion.article>
      </AnimatePresence>
    </div>
  )
}
