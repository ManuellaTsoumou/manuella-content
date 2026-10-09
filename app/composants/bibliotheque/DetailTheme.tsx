'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { ART, NOMS_PILIERS, nomFormat } from '@/lib/contenu'
import { prendreSujet } from '@/app/actions'
import { creerIdee, rangerSujet, trancherIdee } from '@/app/sujets/actions'
import { Etincelle } from '../ui/Bouton'
import { NumeroFiligrane } from '../ui/Carte'
import { useToast } from '../ui/Toast'
import { categorie, type SujetBiblio, type ThemeAffiche, type ThemeBiblio } from './Bibliotheque'

// expo.inOut de GSAP
const EXPO_IN_OUT = [0.87, 0, 0.13, 1] as const
const PLEIN_ECRAN = 'inset(0px 0px 0px 0px round 0px)'

// Le rectangle de la tuile, exprimé comme une découpe de l'écran : la page « sort » de la tuile
function decoupe(element: HTMLElement | null) {
  if (!element) return PLEIN_ECRAN
  const r = element.getBoundingClientRect()
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 26px)`
}

const PASTILLES = {
  pub: { texte: 'Publié', classe: 'bg-bordeaux text-creme font-semibold' },
  plan: { texte: 'Planifié', classe: 'bg-poudre text-bordeaux font-semibold' },
  todo: { texte: 'À faire', classe: 'border border-ligne text-texte-doux font-medium' },
  idee: { texte: 'Nouvelle idée', classe: 'border border-dashed border-bordeaux/40 text-bordeaux font-medium' },
}

type Props = {
  theme: ThemeAffiche
  themes: ThemeBiblio[]
  tuile: HTMLElement | null
  modifier: (id: string, changement: Partial<SujetBiblio>) => void
  surFermer: () => void
}

export default function DetailTheme({ theme, themes, tuile, modifier, surFermer }: Props) {
  const toast = useToast()
  const reduit = useReducedMotion()
  const retour = useRef<HTMLButtonElement>(null)
  const [fermeture, setFermeture] = useState(false)
  const [depart] = useState(() => (reduit || !tuile ? PLEIN_ECRAN : decoupe(tuile)))
  const vrac = theme.id === 'vrac'
  const pourcentage = theme.total ? Math.round((theme.faits / theme.total) * 100) : 0

  function fermer() {
    if (!fermeture) setFermeture(true)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const focus = setTimeout(() => retour.current?.focus({ preventScroll: true }), reduit ? 0 : 500)
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && fermer()
    document.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(focus)
      document.removeEventListener('keydown', echap)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const entree = (rang: number) => ({
    initial: { y: 40, opacity: 0 },
    animate: fermeture ? { y: 20, opacity: 0, transition: { duration: 0.25 } } : { y: 0, opacity: 1 },
    transition: { delay: 0.45 + rang * 0.07, duration: 0.7, ease: COURBES.power3 },
  })

  async function planifier(sujet: SujetBiblio, bouton: HTMLElement) {
    const cat = categorie(sujet)
    if (cat === 'plan') return toast('Déjà dans ton planning', 'info')
    modifier(sujet.id, { planifie: true })
    gerbe(bouton)
    vibrer(15)
    toast(`« ${sujet.titre} » ajouté à ton planning`)
    const { ok } = await prendreSujet(sujet.id)
    if (!ok) {
      modifier(sujet.id, { planifie: false })
      toast('Ce sujet n’a pas pu rejoindre ton planning. Réessaie.', 'erreur')
    }
  }

  async function trancher(sujet: SujetBiblio, decision: 'valide' | 'rejete', bouton: HTMLElement) {
    modifier(sujet.id, { statut: decision })
    vibrer(decision === 'valide' ? 15 : 8)
    if (decision === 'valide') gerbe(bouton)
    toast(decision === 'valide' ? 'Idée validée. Belle intuition.' : 'C’est noté, je retiens que ce n’était pas pour toi.')
    const { ok } = await trancherIdee(sujet.id, decision)
    if (!ok) {
      modifier(sujet.id, { statut: sujet.statut })
      toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')
    }
  }

  async function ranger(sujet: SujetBiblio, themeId: string) {
    if (!themeId) return
    const cible = themes.find((t) => t.id === themeId)
    modifier(sujet.id, { themeId })
    toast(`Rangée dans « ${cible?.nom ?? 'ce thème'} »`)
    const { ok } = await rangerSujet(sujet.id, themeId)
    if (!ok) {
      modifier(sujet.id, { themeId: null })
      toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')
    }
  }

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-theme"
      initial={{ clipPath: depart }}
      animate={{ clipPath: fermeture ? decoupe(tuile) : PLEIN_ECRAN }}
      transition={{ duration: reduit ? 0 : fermeture ? 0.7 : 0.8, ease: EXPO_IN_OUT, delay: fermeture && !reduit ? 0.1 : 0 }}
      onAnimationComplete={() => fermeture && surFermer()}
      className={`grain fixed inset-0 z-50 overflow-y-auto overscroll-contain ${
        vrac ? 'bg-surface text-bordeaux [--chip:rgb(110_20_35/0.08)] [--deco:rgb(110_20_35/0.15)] [--sub:var(--color-texte-doux)]' : ART[theme.pilier]
      }`}
    >
      <div className="sticky top-0 z-[5] flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-2.5">
        <button
          ref={retour}
          type="button"
          onClick={fermer}
          className="flex min-h-[46px] items-center gap-2 rounded-full bg-(--chip) pr-[18px] pl-3.5 text-sm font-medium backdrop-blur-[10px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m11 6-6 6 6 6" />
          </svg>
          Bibliothèque
        </button>
      </div>

      <div className="mx-auto max-w-[760px]">
        <div className="relative flex min-h-[46vh] flex-col justify-end gap-4 overflow-hidden px-[clamp(18px,5vw,40px)] pt-5 pb-[34px]">
          <motion.span
            aria-hidden="true"
            initial={{ y: 80, opacity: 0 }}
            animate={fermeture ? { opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 1.1, ease: COURBES.expo }}
            className="absolute -top-10 -right-2.5"
          >
            <NumeroFiligrane numero={theme.numero} className="relative text-[min(70vw,420px)]" />
          </motion.span>
          <motion.p {...entree(0)} className="relative surtitre text-xs tracking-[0.12em] text-(--sub)">
            {vrac ? 'À ranger dans tes thèmes' : NOMS_PILIERS[theme.pilier]}
          </motion.p>
          <motion.h2
            id="titre-theme"
            {...entree(1)}
            className="relative font-titre text-[clamp(40px,12vw,100px)] font-normal italic leading-[0.95] tracking-[-0.02em] [overflow-wrap:break-word]"
          >
            {theme.nom}
          </motion.h2>
          {!vrac && (
            <motion.div {...entree(2)} className="relative flex max-w-[420px] flex-col gap-2">
              <div className="flex justify-between text-[13px] text-(--sub)">
                <span>
                  {theme.faits} sur {theme.total} sujet{theme.total > 1 ? 's' : ''} traité{theme.faits > 1 ? 's' : ''}
                </span>
                <span>{pourcentage} %</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-(--chip)">
                <motion.span
                  className={`block h-full rounded-full ${theme.pilier === 'evoluer' ? 'bg-bordeaux' : 'bg-or'}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pourcentage}%` }}
                  transition={{ delay: 0.8, duration: 1.2, ease: COURBES.power3 }}
                />
              </div>
            </motion.div>
          )}
          <motion.div {...entree(3)} className="relative self-start">
            <button
              type="button"
              onClick={() => {
                vibrer(10)
                toast('La proposition de sujets par l’IA arrive bientôt', 'info')
              }}
              className="reflet flex min-h-[52px] items-center gap-2.5 rounded-2xl bg-nuit px-5 text-[15px] font-semibold text-creme"
            >
              <Etincelle className="relative text-or" />
              <span className="relative">Proposer de nouveaux sujets avec l’IA</span>
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ y: 120 }}
        animate={fermeture ? { opacity: 0, y: 20, transition: { duration: 0.25 } } : { y: 0 }}
        transition={{ delay: 0.55, duration: 0.9, ease: COURBES.expo }}
        className="relative min-h-[60vh] rounded-t-[32px] bg-fond px-[clamp(14px,4vw,32px)] pt-[26px] pb-[calc(60px+env(safe-area-inset-bottom,0px))] text-texte"
      >
        <div className="mx-auto max-w-[760px]">
          <div className="mx-1 mb-4 flex items-baseline justify-between">
            <h3 className="font-titre text-[28px] font-medium">Les sujets</h3>
            <span className="text-[13px] text-texte-doux">{theme.sujets.length} au total</span>
          </div>

          {theme.sujets.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="font-titre text-[26px] font-medium italic">Ce thème t’attend</p>
              <p className="mt-2 text-texte-doux">Ajoute ta première idée juste en dessous.</p>
            </div>
          )}

          <div className="grid gap-3 carte:grid-cols-2">
            <AnimatePresence initial={false}>
              {theme.sujets.map((sujet, i) => (
                <CarteSujet
                  key={sujet.id}
                  sujet={sujet}
                  rang={i}
                  vrac={vrac}
                  themes={themes}
                  surPlanifier={planifier}
                  surTrancher={trancher}
                  surRanger={ranger}
                />
              ))}
            </AnimatePresence>
          </div>

          <NouvelleIdee themeId={vrac ? null : theme.id} />
        </div>
      </motion.div>
    </motion.section>
  )
}

function CarteSujet({
  sujet,
  rang,
  vrac,
  themes,
  surPlanifier,
  surTrancher,
  surRanger,
}: {
  sujet: SujetBiblio
  rang: number
  vrac: boolean
  themes: ThemeBiblio[]
  surPlanifier: (s: SujetBiblio, b: HTMLElement) => void
  surTrancher: (s: SujetBiblio, d: 'valide' | 'rejete', b: HTMLElement) => void
  surRanger: (s: SujetBiblio, themeId: string) => void
}) {
  const cat = categorie(sujet)
  const pastille = PASTILLES[cat]
  const format = nomFormat(sujet.format)
  const bouton = 'min-h-[46px] flex-1 rounded-petit px-2 text-sm font-medium transition-[transform,background-color] duration-200 active:scale-[0.96]'

  return (
    <motion.article
      layout
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
      transition={{ delay: 0.7 + Math.min(rang, 8) * 0.08, duration: 0.6, ease: COURBES.power3 }}
      className="flex flex-col gap-3.5 rounded-[24px] border border-ligne bg-surface p-[18px] shadow-carte"
    >
      <div className="flex flex-wrap gap-2">
        <motion.span
          key={cat}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 3, 0.64, 1] }}
          className={`rounded-full px-[11px] py-1.5 text-xs ${pastille.classe}`}
        >
          {pastille.texte}
        </motion.span>
        {format && <span className="rounded-full bg-bordeaux/6 px-[11px] py-1.5 text-xs font-medium text-bordeaux">{format}</span>}
      </div>
      <h4 className="font-titre text-[23px] font-medium leading-[1.15]">{sujet.titre}</h4>

      {vrac && (
        <label className="flex flex-col gap-1.5 text-[13px] text-texte-doux">
          Ranger dans un thème
          <select
            defaultValue=""
            onChange={(e) => surRanger(sujet, e.target.value)}
            className="min-h-11 rounded-petit border border-ligne bg-fond px-3 text-sm text-texte outline-none focus:border-bordeaux focus:shadow-focus"
          >
            <option value="" disabled>
              Choisis un thème…
            </option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-auto flex gap-2">
        {cat === 'idee' ? (
          <>
            <button
              type="button"
              onClick={(e) => surTrancher(sujet, 'rejete', e.currentTarget)}
              className={`${bouton} border border-ligne bg-transparent text-texte`}
            >
              Mettre de côté
            </button>
            <button
              type="button"
              onClick={(e) => surTrancher(sujet, 'valide', e.currentTarget)}
              className={`${bouton} flex-[1.4] bg-bordeaux font-semibold text-creme`}
            >
              Valider
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={cat === 'pub'}
              onClick={(e) => surPlanifier(sujet, e.currentTarget)}
              className={`${bouton} border ${
                cat === 'todo' ? 'border-ligne bg-transparent text-texte' : 'border-poudre bg-poudre font-semibold text-bordeaux'
              } disabled:cursor-default`}
            >
              {cat === 'pub' ? 'Déjà publié' : cat === 'plan' ? 'Planifié ✓' : 'Planifier'}
            </button>
            <Link
              href={`/sujets/${sujet.id}`}
              className={`${bouton} flex flex-[1.4] items-center justify-center bg-bordeaux text-center font-semibold text-creme no-underline hover:text-creme`}
            >
              Développer avec l’IA
            </Link>
          </>
        )}
      </div>
    </motion.article>
  )
}

// Petite saisie en bas de la liste pour ajouter une idée directement dans ce thème
function NouvelleIdee({ themeId }: { themeId: string | null }) {
  const toast = useToast()
  const [texte, setTexte] = useState('')
  const [envoi, setEnvoi] = useState(false)

  async function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texte.trim()) return
    setEnvoi(true)
    const { ok } = await creerIdee(texte, themeId)
    setEnvoi(false)
    if (!ok) return toast('Ton idée n’a pas pu être enregistrée. Réessaie.', 'erreur')
    setTexte('')
    vibrer(12)
    toast('Idée ajoutée. Elle t’attend juste au-dessus.')
  }

  return (
    <form onSubmit={ajouter} className="mt-5 flex gap-2">
      <label htmlFor="nouvelle-idee" className="sr-only">
        Une nouvelle idée pour ce thème
      </label>
      <input
        id="nouvelle-idee"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        maxLength={300}
        placeholder="Une nouvelle idée pour ce thème…"
        className="min-h-[52px] min-w-0 flex-1 rounded-[18px] border border-ligne bg-surface px-4 text-base outline-none transition-[border-color,box-shadow] duration-[250ms] placeholder:text-texte-doux focus:border-bordeaux focus:shadow-focus"
      />
      <button
        type="submit"
        disabled={envoi || !texte.trim()}
        className="min-h-[52px] shrink-0 rounded-[18px] bg-bordeaux px-5 text-sm font-semibold text-creme transition-opacity disabled:opacity-50"
      >
        {envoi ? '…' : 'Ajouter'}
      </button>
    </form>
  )
}
