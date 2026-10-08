'use client'

import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { useToast } from '../ui/Toast'
import { ARRIVEE, TeteDeSection } from './Accueil'
import IdeeVocale from './IdeeVocale'

type Raccourci = { titre: string; detail: string; icone: ReactNode; bientot?: string }

const ICONE = 'size-[22px]'

const AUTRES: Raccourci[] = [
  {
    titre: 'Téléprompteur',
    detail: 'Lis ton script en filmant',
    bientot: 'Le téléprompteur arrive bientôt',
    icone: (
      <svg className={ICONE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M7 8h10M7 12h6M9 21h6" />
      </svg>
    ),
  },
  {
    titre: 'Générer avec l’IA',
    detail: 'Un sujet sur mesure',
    bientot: 'Le générateur de sujets arrive bientôt',
    icone: (
      <svg className={ICONE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      </svg>
    ),
  },
  {
    titre: 'Bilan de la semaine',
    detail: 'Tes victoires en story',
    bientot: 'Ton bilan de la semaine arrive bientôt',
    icone: (
      <svg className={ICONE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
]

const BOUTON =
  'relative flex min-h-[118px] flex-col items-start justify-between gap-[18px] overflow-hidden rounded-[24px] border p-4 text-left transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-survol active:scale-[0.97]'

export default function Raccourcis() {
  const toast = useToast()
  const boutonVocal = useRef<HTMLButtonElement>(null)
  const [enregistreur, setEnregistreur] = useState(false)

  function fermerEnregistreur(enregistree: boolean) {
    setEnregistreur(false)
    boutonVocal.current?.focus({ preventScroll: true })
    if (enregistree) setTimeout(() => gerbe(boutonVocal.current), 300)
  }

  return (
    <section>
      <TeteDeSection titre="En un geste" rang={3} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ARRIVEE.sections + 0.3, duration: 0.6, ease: COURBES.power3 }}
        className="grid grid-cols-2 gap-2.5"
      >
        <button
          ref={boutonVocal}
          type="button"
          onClick={() => {
            vibrer(15)
            setEnregistreur(true)
          }}
          className={`${BOUTON} fond-bouton border-transparent text-blanc`}
        >
          <span className="grid size-11 place-items-center rounded-petit bg-creme/15 text-or">
            <svg className={ICONE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </span>
          <span>
            <b className="block text-[15px] font-medium">Idée vocale</b>
            <small className="mt-0.5 block text-xs text-sur-bordeaux">Capture-la avant qu’elle file</small>
          </span>
        </button>

        {AUTRES.map((r) => (
          <button
            key={r.titre}
            type="button"
            onClick={() => {
              vibrer(6)
              toast(r.bientot!, 'info')
            }}
            className={`${BOUTON} border-ligne bg-surface`}
          >
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-petit bg-poudre text-bordeaux">
              {r.icone}
            </span>
            <span>
              <b className="block text-[15px] font-medium">{r.titre}</b>
              <small className="mt-0.5 block text-xs text-texte-doux">{r.detail}</small>
            </span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence>{enregistreur && <IdeeVocale surFermer={fermerEnregistreur} />}</AnimatePresence>
    </section>
  )
}
