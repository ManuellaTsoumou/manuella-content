'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { vibrer } from '@/lib/confettis'
import { nomFormat } from '@/lib/contenu'
import { useToast } from '../ui/Toast'
import { ARRIVEE, TeteDeSection, type JourSemaine } from './Accueil'

const ETIQUETTES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function Semaine({ semaine, indexAujourdhui }: { semaine: JourSemaine[]; indexAujourdhui: number }) {
  const toast = useToast()
  const [choisi, setChoisi] = useState(Math.max(indexAujourdhui, 0))
  const jour = semaine[choisi]

  return (
    <section>
      <TeteDeSection titre="Ta semaine" rang={1}>
        <button
          type="button"
          onClick={() => toast('Le planning complet arrive bientôt', 'info')}
          className="min-h-11 text-[13px] text-texte-doux hover:text-bordeaux"
        >
          Tout le planning
        </button>
      </TeteDeSection>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ARRIVEE.sections + 0.2, duration: 0.6, ease: COURBES.power3 }}
        className="grid grid-cols-7 gap-1.5"
      >
        {semaine.map((j, i) => {
          const date = new Date(`${j.jour}T12:00:00Z`)
          const libelle = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(date)
          const actif = i === choisi
          return (
            <button
              key={j.jour}
              type="button"
              aria-pressed={actif}
              aria-label={`${libelle}, ${j.off ? 'jour off' : `${j.contenus.length} contenu${j.contenus.length > 1 ? 's' : ''}`}`}
              onClick={() => {
                setChoisi(i)
                vibrer(6)
              }}
              className={`flex min-h-[78px] flex-col items-center gap-1.5 rounded-[18px] border py-2.5 transition-[background-color,color,transform] duration-200 active:scale-95 ${
                actif
                  ? 'border-bordeaux bg-bordeaux text-blanc'
                  : `bg-surface ${i === indexAujourdhui ? 'border-bordeaux' : 'border-ligne'}`
              }`}
            >
              <small className={`text-[11px] uppercase tracking-[0.06em] ${actif ? 'text-sur-bordeaux' : 'text-texte-doux'}`}>
                {ETIQUETTES[i]}
              </small>
              <b className="font-titre text-xl font-medium leading-none">{j.numero}</b>
              <span className="flex min-h-1.5 gap-[3px]">
                {j.off ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-60">
                    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                  </svg>
                ) : (
                  j.contenus.slice(0, 4).map((c) => (
                    <i key={c.id} className={`size-[5px] rounded-full ${actif ? 'bg-or' : 'bg-bordeaux'}`} />
                  ))
                )}
              </span>
            </button>
          )
        })}
      </motion.div>

      <div aria-live="polite" className="mt-3 flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {jour.off ? (
            <Creneau key={`${jour.jour}-off`} repos>
              Jour off. Repose-toi, tu l’as mérité.
            </Creneau>
          ) : jour.contenus.length === 0 ? (
            <Creneau key={`${jour.jour}-vide`} repos>
              Rien de prévu. Une suggestion te tente ?
            </Creneau>
          ) : (
            jour.contenus.map((c, i) => (
              <Creneau key={c.id} rang={i}>
                <span className="min-w-11 text-xs text-texte-doux">{c.heure ?? 'À caler'}</span>
                <span className="min-w-0 flex-1 font-medium">{c.titre}</span>
                {nomFormat(c.format) && (
                  <span className="whitespace-nowrap rounded-full bg-poudre px-2.5 py-[5px] text-xs text-bordeaux max-[360px]:hidden">
                    {nomFormat(c.format)}
                  </span>
                )}
              </Creneau>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Creneau({ children, repos = false, rang = 0 }: { children: React.ReactNode; repos?: boolean; rang?: number }) {
  return (
    <motion.div
      layout
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: rang * 0.06, duration: 0.4, ease: COURBES.power3 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className={`flex items-center gap-3 rounded-[18px] border border-ligne bg-surface px-4 py-3.5 ${
        repos ? 'justify-center italic text-texte-doux' : ''
      }`}
    >
      {children}
    </motion.div>
  )
}
