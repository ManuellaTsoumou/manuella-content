'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { IconType } from 'react-icons'
import { SiFacebook, SiInstagram, SiPinterest, SiSnapchat, SiTiktok, SiX, SiYoutube } from 'react-icons/si'
import { COURBES } from '@/lib/animation'
import { prochainPalier } from '@/lib/contenu'
import Compteur from '../ui/Compteur'
import { ARRIVEE, TeteDeSection, type Reseau } from './Accueil'

const RESEAUX: Record<string, { nom: string; icone?: IconType }> = {
  instagram: { nom: 'Instagram', icone: SiInstagram },
  tiktok: { nom: 'TikTok', icone: SiTiktok },
  youtube: { nom: 'YouTube', icone: SiYoutube },
  snapchat: { nom: 'Snapchat', icone: SiSnapchat },
  facebook: { nom: 'Facebook', icone: SiFacebook },
  x: { nom: 'X', icone: SiX },
  pinterest: { nom: 'Pinterest', icone: SiPinterest },
  autre: { nom: 'Autre' },
}

// Périmètre du cercle (rayon 44)
const PERIMETRE = 276.5
// Un anneau sur deux en or profond, comme TikTok dans la maquette
const COULEURS_ANNEAU = ['stroke-bordeaux', 'stroke-or-profond']
const FORMAT = new Intl.NumberFormat('fr-FR')

export default function Progression({ reseaux }: { reseaux: Reseau[] }) {
  return (
    <section>
      <TeteDeSection titre="Vers les 10 000" rang={2}>
        par réseau
      </TeteDeSection>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ARRIVEE.sections + 0.25, duration: 0.6, ease: COURBES.power3 }}
        className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1"
      >
        {reseaux.length === 0 && (
          <div className="col-span-full rounded-carte border border-ligne bg-surface p-5 text-center">
            <p className="font-titre text-[22px] italic">Tes réseaux t’attendent</p>
            <Link href="/profil" className="mt-2 inline-flex min-h-11 items-center font-medium">
              Les ajouter dans mon profil
            </Link>
          </div>
        )}
        {reseaux.map((r, i) => {
          const infos = RESEAUX[r.plateforme] ?? { nom: r.plateforme }
          const Icone = infos.icone
          const part = Math.min(1, r.abonnes / Math.max(r.objectif, 1))
          const palier = prochainPalier(r.abonnes, r.objectif)
          return (
            <div
              key={r.id}
              className="flex flex-col items-center gap-2.5 rounded-carte border border-ligne bg-surface p-[18px] text-center shadow-carte"
            >
              <p className="flex items-center gap-2 text-sm font-medium text-bordeaux">
                {Icone && <Icone size={18} aria-hidden="true" />}
                {infos.nom}
              </p>
              <div className="relative aspect-square w-[min(130px,100%)]">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" className="stroke-poudre" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={PERIMETRE}
                    className={COULEURS_ANNEAU[i % 2]}
                    initial={{ strokeDashoffset: PERIMETRE }}
                    animate={{ strokeDashoffset: PERIMETRE * (1 - part) }}
                    transition={{ delay: ARRIVEE.anneaux, duration: 1.6, ease: COURBES.power3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="font-titre text-[clamp(22px,6vw,28px)] font-medium leading-none">
                    <Compteur valeur={r.abonnes} delai={ARRIVEE.anneaux} />
                  </b>
                  <small className="mt-1 text-[11px] text-texte-doux">sur {FORMAT.format(r.objectif)}</small>
                </div>
              </div>
              <p className="text-[13px] text-texte-doux">
                {palier ? (
                  <>
                    Prochain palier : <strong className="font-medium text-texte">{FORMAT.format(palier)}</strong>
                  </>
                ) : (
                  <strong className="font-medium text-bordeaux">Objectif atteint, bravo !</strong>
                )}
              </p>
            </div>
          )
        })}
      </motion.div>
    </section>
  )
}
