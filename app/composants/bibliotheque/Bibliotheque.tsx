'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { COURBES, RESSORTS } from '@/lib/animation'
import { vibrer } from '@/lib/confettis'
import type { Format, Pilier } from '@/lib/contenu'
import Avatar from '../ui/Avatar'
import Cloche from '../ui/Cloche'
import Compteur from '../ui/Compteur'
import Couverture from '../ui/Couverture'
import EtatVide from '../ui/EtatVide'
import Lettres from '../ui/Lettres'
import RubanLeopard from '../ui/RubanLeopard'
import DetailTheme from './DetailTheme'
import FondVivant from './FondVivant'
import Intro from './Intro'
import Paquet from './Paquet'
import Tuile from './Tuile'

export const CLE_INTRO = 'manuella-intro-bibliotheque'

export type ThemeBiblio = {
  id: string
  nom: string
  numero: string
  pilier: Pilier
  taille: 'big' | 'wide' | 'tall' | 'small'
}

export type SujetBiblio = {
  id: string
  titre: string
  statut: string
  format: Format | null
  themeId: string | null
  planifie: boolean
}

export type ThemeAffiche = ThemeBiblio & { sujets: SujetBiblio[]; faits: number; total: number; prochain: string | null }

export type DonneesBibliotheque = {
  nom: string
  photo: string
  salutation: string
  themes: ThemeBiblio[]
  sujets: SujetBiblio[]
}

// Publié / Planifié / À faire, plus les nouvelles idées à valider
export function categorie(s: SujetBiblio): 'pub' | 'plan' | 'idee' | 'todo' {
  if (s.statut === 'publie') return 'pub'
  if (s.planifie || s.statut === 'tourne') return 'plan'
  if (s.statut === 'idee') return 'idee'
  return 'todo'
}

// Recherche sans accents ni majuscules
const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const FILTRES: { valeur: 'tout' | Pilier; libelle: string }[] = [
  { valeur: 'tout', libelle: 'Tout' },
  { valeur: 'soin', libelle: 'Soin de soi' },
  { valeur: 'mental', libelle: 'Me construire' },
  { valeur: 'evoluer', libelle: 'Évoluer' },
]

export default function Bibliotheque({ donnees }: { donnees: DonneesBibliotheque }) {
  const [changements, setChangements] = useState<Record<string, Partial<SujetBiblio>>>({})
  const [filtre, setFiltre] = useState<'tout' | Pilier>('tout')
  const [saisie, setSaisie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState<{ id: string; tuile: HTMLElement | null; empile: boolean } | null>(null)
  const [paquet, setPaquet] = useState(false)
  const [phase, setPhase] = useState<'attente' | 'cascade' | 'filtre'>('attente')
  const boutonSurprise = useRef<HTMLButtonElement>(null)
  const revele = phase !== 'attente'

  // Les modifications faites ici (planifier, valider, ranger) s'affichent tout de suite
  const modifier = (id: string, changement: Partial<SujetBiblio>) =>
    setChangements((c) => ({ ...c, [id]: { ...c[id], ...changement } }))

  const sujets = useMemo(
    () =>
      donnees.sujets
        .map((s) => ({ ...s, ...changements[s.id] }))
        .filter((s) => s.statut !== 'rejete'),
    [donnees.sujets, changements]
  )

  const themes = useMemo<ThemeAffiche[]>(() => {
    const avecSujets = (id: string | null) => sujets.filter((s) => s.themeId === id)
    const affiche = (t: ThemeBiblio, liste: SujetBiblio[]): ThemeAffiche => ({
      ...t,
      sujets: liste,
      total: liste.length,
      faits: liste.filter((s) => s.statut === 'publie').length,
      prochain:
        liste.find((s) => categorie(s) === 'todo')?.titre ?? liste.find((s) => categorie(s) !== 'pub')?.titre ?? null,
    })
    const liste = donnees.themes.map((t) => affiche(t, avecSujets(t.id)))
    // Les idées sans thème (souvent les idées vocales) ont leur propre tuile, à ranger
    const enVrac = avecSujets(null)
    if (enVrac.length) {
      liste.push(affiche({ id: 'vrac', nom: 'Idées en vrac', numero: '+', pilier: 'soin', taille: 'small' }, enVrac))
    }
    return liste
  }, [donnees.themes, sujets])

  const visibles = themes.filter((t) => {
    if (filtre !== 'tout' && (t.id === 'vrac' || t.pilier !== filtre)) return false
    if (!recherche) return true
    const q = normaliser(recherche)
    return normaliser(t.nom).includes(q) || t.sujets.some((s) => normaliser(s.titre).includes(q))
  })

  const themeOuvert = ouvert ? themes.find((t) => t.id === ouvert.id) ?? null : null
  const tirables = sujets
    .filter((s) => ['todo', 'idee'].includes(categorie(s)))
    .map((s) => ({ sujet: s, theme: donnees.themes.find((t) => t.id === s.themeId) ?? null }))

  // Recherche instantanée, avec un court temps de répit pendant la frappe
  useEffect(() => {
    const minuterie = setTimeout(() => setRecherche(saisie.trim()), 140)
    return () => clearTimeout(minuterie)
  }, [saisie])

  // Lien direct vers un thème (/sujets?theme=…) et bouton retour du téléphone
  useEffect(() => {
    const lire = () => new URLSearchParams(window.location.search).get('theme')
    const initial = lire()
    // L'adresse n'existe que dans le navigateur : on l'y lit une fois, au montage
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initial) setOuvert({ id: initial, tuile: null, empile: false })
    const retour = () => {
      if (!lire()) setOuvert(null)
    }
    window.addEventListener('popstate', retour)
    return () => window.removeEventListener('popstate', retour)
  }, [])

  // Une fois la cascade d'arrivée jouée, les tuiles qui réapparaissent au filtrage grandissent simplement
  useEffect(() => {
    if (phase !== 'cascade') return
    const suite = setTimeout(() => setPhase('filtre'), 2200)
    return () => clearTimeout(suite)
  }, [phase])

  function ouvrir(theme: ThemeAffiche, tuile: HTMLElement) {
    vibrer(8)
    window.history.pushState(null, '', `/sujets?theme=${theme.id}`)
    setOuvert({ id: theme.id, tuile, empile: true })
  }

  function fermerTheme() {
    const empile = ouvert?.empile
    setOuvert(null)
    ouvert?.tuile?.focus({ preventScroll: true })
    if (empile) window.history.back()
    else window.history.replaceState(null, '', '/sujets')
  }

  const apparition = (rang: number) => ({
    initial: { y: 26, opacity: 0 },
    animate: revele ? { y: 0, opacity: 1 } : undefined,
    transition: { delay: 0.3 + rang * 0.08, duration: 0.7, ease: COURBES.power3 },
  })

  return (
    <>
      <Intro cle={CLE_INTRO} salutation={donnees.salutation} nom={donnees.nom} photo={donnees.photo} surFin={() => setPhase('cascade')} />
      <FondVivant />

      <main className="relative z-[2] mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
        <Couverture className="carte:px-8 carte:pt-6" aria-label="La Bibliothèque">
          <header className="flex items-center justify-between gap-3">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={revele ? { y: 0, opacity: 1 } : undefined}
              transition={{ duration: 0.6, ease: COURBES.power3 }}
              className="flex items-center gap-3"
            >
              <Avatar src={donnees.photo} />
              <div>
                <small className="block text-[13px] text-sur-bordeaux">{donnees.salutation}</small>
                <strong className="block font-titre text-[21px] font-medium italic leading-[1.15]">{donnees.nom}</strong>
              </div>
            </motion.div>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={revele ? { y: 0, opacity: 1 } : undefined}
              transition={{ delay: 0.08, duration: 0.6, ease: COURBES.power3 }}
            >
              <Cloche nombre={sujets.filter((s) => s.statut === 'idee').length} />
            </motion.div>
          </header>

          <section className="px-0.5 pt-[30px] pb-1.5">
            <h1 className="font-titre text-[clamp(38px,12.4vw,118px)] font-medium leading-[0.92] tracking-[-0.025em] text-blanc [overflow-wrap:break-word]">
              <Lettres texte="La" actif={revele} ecart={0.035} duree={0.9} rotation={6} />{' '}
              <em className="block font-normal italic">
                <Lettres texte="Bibliothèque" actif={revele} delai={0.07} ecart={0.035} duree={0.9} rotation={6} />
              </em>
            </h1>
            <motion.p {...apparition(0)} className="mt-3.5 text-[15px] text-sur-bordeaux">
              <b className="font-semibold text-creme">{revele ? <Compteur valeur={sujets.length} delai={0.5} /> : 0}</b> sujets ·{' '}
              {donnees.themes.length} thèmes · 3 piliers
            </motion.p>
            <motion.div {...apparition(1)}>
              <RubanLeopard className="mt-4" />
            </motion.div>
          </section>

          <div className="mt-[22px] flex flex-col gap-3 large:flex-row large:items-center">
            <motion.div
              {...apparition(2)}
              className="flex h-14 items-center gap-2.5 rounded-[18px] border border-creme/22 bg-creme/10 px-4 transition-[border-color,box-shadow] duration-[250ms] focus-within:border-or focus-within:shadow-focus-or large:flex-1"
            >
              <label htmlFor="recherche" className="sr-only">
                Rechercher un sujet
              </label>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="flex-none text-sur-bordeaux">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id="recherche"
                type="search"
                autoComplete="off"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder="confiance, routine, anglais…"
                className="h-[52px] min-w-0 flex-1 border-0 bg-transparent text-base text-creme outline-none placeholder:text-sur-bordeaux"
              />
            </motion.div>

            <motion.div
              {...apparition(3)}
              role="group"
              aria-label="Filtrer par pilier"
              className="relative flex w-max max-w-full gap-1.5 overflow-x-auto rounded-full border border-creme/22 bg-creme/10 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {FILTRES.map((f) => {
                const actif = filtre === f.valeur
                return (
                  <button
                    key={f.valeur}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => {
                      vibrer(6)
                      setFiltre(f.valeur)
                    }}
                    className={`relative min-h-11 whitespace-nowrap rounded-full px-[18px] text-sm tracking-[0.02em] transition-colors duration-300 ${
                      actif ? 'text-bordeaux' : 'text-creme'
                    }`}
                  >
                    {actif && (
                      <motion.span
                        layoutId="indicateur-pilier"
                        transition={{ duration: 0.5, ease: COURBES.expo }}
                        className="absolute inset-0 z-0 rounded-full bg-creme"
                      />
                    )}
                    <span className="relative z-[1]">{f.libelle}</span>
                  </button>
                )
              })}
            </motion.div>
          </div>
        </Couverture>

        <motion.button
          {...apparition(4)}
          ref={boutonSurprise}
          type="button"
          onClick={() => {
            vibrer(10)
            setPaquet(true)
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group fond-bouton reflet mt-[18px] flex min-h-[72px] w-full items-center justify-between gap-3.5 rounded-[22px] px-5 text-left text-creme shadow-bouton"
        >
          <span className="relative flex items-center gap-3.5">
            <span aria-hidden="true" className="relative h-[42px] w-[34px] flex-none">
              {['-rotate-12 -translate-x-1 group-hover:-rotate-20 group-hover:-translate-x-2', 'rotate-6 translate-x-[3px] group-hover:rotate-[14deg] group-hover:translate-x-1.5', ''].map((t, i) => (
                <i
                  key={i}
                  className={`absolute inset-0 rounded-md border-[1.5px] border-or bg-bordeaux-nuit bg-(image:--leo-or) bg-size-[40px_40px] transition-transform duration-[350ms] ease-doux ${t}`}
                />
              ))}
            </span>
            <span>
              <b className="block font-titre text-[22px] font-medium italic leading-[1.1]">Surprends-moi</b>
              <small className="mt-[3px] block text-[13px] text-sur-bordeaux">Je mélange le paquet et je tire ton sujet</small>
            </span>
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="relative text-or">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </motion.button>

        <motion.div {...apparition(5)} className="mx-0.5 mt-[34px] mb-3.5 flex items-baseline justify-between">
          <h2 className="font-titre text-[27px] font-medium">Tes thèmes</h2>
          <span className="text-[13px] text-texte-doux">
            {visibles.length} thème{visibles.length > 1 ? 's' : ''}
          </span>
        </motion.div>

        <LayoutGroup>
          <div className="grid grid-flow-dense auto-rows-[124px] grid-cols-2 gap-2.5 max-[360px]:auto-rows-[112px] max-[360px]:gap-2 tablette:auto-rows-[150px] tablette:grid-cols-3 tablette:gap-3 ecran:auto-rows-[165px] ecran:grid-cols-4 ecran:gap-3.5">
            <AnimatePresence mode="popLayout">
              {visibles.map((t, i) => (
                <Tuile key={t.id} theme={t} rang={i} arrivee={phase} surOuvrir={ouvrir} />
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>

        <AnimatePresence>
          {visibles.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={RESSORTS.doux}>
              <EtatVide titre="Rien trouvé, ma belle" texte="Essaie un autre mot, ou laisse-toi surprendre." />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {themeOuvert && (
        <DetailTheme
          key={themeOuvert.id}
          theme={themeOuvert}
          themes={donnees.themes}
          tuile={ouvert?.tuile ?? null}
          modifier={modifier}
          surFermer={fermerTheme}
        />
      )}

      {paquet && (
        <Paquet
          tirables={tirables}
          modifier={modifier}
          surFermer={() => {
            setPaquet(false)
            boutonSurprise.current?.focus({ preventScroll: true })
          }}
        />
      )}
    </>
  )
}
