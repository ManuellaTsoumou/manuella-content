'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { decalerJour } from '@/lib/dates'
import { ART, NOMS_PILIERS, nomFormat, type Format, type Pilier } from '@/lib/contenu'
import {
  basculerJourOffLe,
  changerHeure,
  deplacerContenu,
  marquerPublie,
  planifierLe,
  retirerContenu,
} from '@/app/planning/actions'
import Couverture from '../ui/Couverture'
import Feuille from '../ui/Feuille'
import RubanLeopard from '../ui/RubanLeopard'
import { useToast } from '../ui/Toast'

export type ContenuPlanning = {
  id: string
  jour: string
  heure: string | null
  sujetId: string
  ficheId: string | null
  titre: string
  format: Format | null
  pilier: Pilier
  theme: string | null
  publie: boolean
}

export type Candidat = { id: string; titre: string; format: Format | null; pilier: Pilier; theme: string | null }

type Props = {
  jours: string[]
  aujourdhui: string
  off: string[]
  contenus: ContenuPlanning[]
  candidats: Candidat[]
}

const ETIQUETTES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const date = (jour: string) => new Date(`${jour}T12:00:00Z`)
const jourLong = (jour: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date(jour))
const mois = (jour: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' }).format(date(jour))

export default function Planning({ jours, aujourdhui, off: offInitial, contenus: contenusInitiaux, candidats }: Props) {
  const toast = useToast()

  // État local pour réagir tout de suite, recalé dès que le serveur renvoie les vraies données
  const [source, setSource] = useState(contenusInitiaux)
  const [contenus, setContenus] = useState(contenusInitiaux)
  const [sourceOff, setSourceOff] = useState(offInitial)
  const [off, setOff] = useState(() => new Set(offInitial))
  if (source !== contenusInitiaux) {
    setSource(contenusInitiaux)
    setContenus(contenusInitiaux)
  }
  if (sourceOff !== offInitial) {
    setSourceOff(offInitial)
    setOff(new Set(offInitial))
  }

  const [enMain, setEnMain] = useState<ContenuPlanning | null>(null)
  const [ouvert, setOuvert] = useState<ContenuPlanning | null>(null)
  const [ajoutLe, setAjoutLe] = useState<string | null>(null)

  // Souris : on attrape après 6 px ; doigt : appui long (le défilement de la page reste possible) ; clavier : espace
  const capteurs = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const parJour = useMemo(() => {
    const m = new Map<string, ContenuPlanning[]>(jours.map((j) => [j, []]))
    for (const c of contenus) m.get(c.jour)?.push(c)
    for (const liste of m.values()) liste.sort((a, b) => (a.heure ?? '99').localeCompare(b.heure ?? '99'))
    return m
  }, [contenus, jours])

  const prevus = contenus.length
  const publies = contenus.filter((c) => c.publie).length
  const debut = date(jours[0]).getUTCDate()
  const fin = date(jours[6]).getUTCDate()
  const libelleSemaine =
    mois(jours[0]) === mois(jours[6]) ? `${debut} au ${fin} ${mois(jours[6])}` : `${debut} ${mois(jours[0])} au ${fin} ${mois(jours[6])}`
  const cetteSemaine = jours.includes(aujourdhui)

  function modifier(id: string, changement: Partial<ContenuPlanning>) {
    setContenus((liste) => liste.map((c) => (c.id === id ? { ...c, ...changement } : c)))
    setOuvert((o) => (o?.id === id ? { ...o, ...changement } : o))
  }

  async function deposer(e: DragEndEvent) {
    setEnMain(null)
    const contenu = contenus.find((c) => c.id === e.active.id)
    const cible = e.over?.id as string | undefined
    if (!contenu || !cible || cible === contenu.jour) return
    const ancien = contenu.jour
    modifier(contenu.id, { jour: cible })
    vibrer(15)
    toast(off.has(cible) ? `Déplacé à ${jourLong(cible)}… ton jour off, vraiment ?` : `Déplacé à ${jourLong(cible)}`, off.has(cible) ? 'info' : 'succes')
    const { ok } = await deplacerContenu(contenu.id, cible)
    if (!ok) {
      modifier(contenu.id, { jour: ancien })
      toast('Ce contenu n’a pas pu changer de jour. Réessaie.', 'erreur')
    }
  }

  async function basculerOff(jour: string) {
    const actif = !off.has(jour)
    setOff((s) => {
      const n = new Set(s)
      if (actif) n.add(jour)
      else n.delete(jour)
      return n
    })
    vibrer(10)
    toast(actif ? `${jourLong(jour)} : jour off. Tu l’as mérité.` : `${jourLong(jour)} : on reprend en douceur.`)
    const { ok } = await basculerJourOffLe(jour, actif)
    if (!ok) toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')
  }

  return (
    <main className="relative mx-auto max-w-[1120px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[140px] max-[360px]:px-3">
      <Couverture aria-label="Ton planning">
        <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">{cetteSemaine ? 'Cette semaine' : 'Ton planning'}</p>
        <h1 className="mt-3 font-titre text-[clamp(34px,10cqi,84px)] font-medium leading-[0.95] tracking-[-0.025em]">
          Semaine du <em className="block font-normal italic">{libelleSemaine}</em>
        </h1>
        <p className="mt-3.5 text-[15px] text-sur-bordeaux">
          <b className="font-semibold text-creme">{prevus}</b> contenu{prevus > 1 ? 's' : ''} prévu{prevus > 1 ? 's' : ''} ·{' '}
          <b className="font-semibold text-creme">{publies}</b> publié{publies > 1 ? 's' : ''} ·{' '}
          <b className="font-semibold text-creme">{jours.filter((j) => off.has(j)).length}</b> jour{jours.filter((j) => off.has(j)).length > 1 ? 's' : ''} off
        </p>
        <RubanLeopard className="mt-4" />
        <nav aria-label="Changer de semaine" className="mt-[22px] flex flex-wrap items-center gap-2">
          <LienSemaine href={`/planning?semaine=${decalerJour(jours[0], -7)}`} libelle="Semaine précédente">
            <path d="m15 6-6 6 6 6" />
          </LienSemaine>
          {!cetteSemaine && (
            <Link
              href="/planning"
              className="inline-flex min-h-11 items-center rounded-full border border-creme/22 bg-creme/10 px-4 text-sm text-creme no-underline hover:text-creme"
            >
              Revenir à cette semaine
            </Link>
          )}
          <LienSemaine href={`/planning?semaine=${decalerJour(jours[0], 7)}`} libelle="Semaine suivante">
            <path d="m9 6 6 6-6 6" />
          </LienSemaine>
        </nav>
      </Couverture>

      <p className="mx-1 mt-[26px] mb-3 text-[13px] text-texte-doux">
        Touche un contenu pour le gérer. Pour le changer de jour, garde le doigt appuyé puis fais-le glisser.
      </p>

      <DndContext
        sensors={capteurs}
        onDragStart={(e) => {
          vibrer(8)
          setEnMain(contenus.find((c) => c.id === e.active.id) ?? null)
        }}
        onDragCancel={() => setEnMain(null)}
        onDragEnd={deposer}
        accessibility={{
          announcements: {
            onDragStart: () => 'Contenu attrapé. Choisis un jour avec les flèches, puis espace pour le poser.',
            onDragOver: ({ over }) => (over ? `Au-dessus de ${jourLong(String(over.id))}` : 'Hors des jours'),
            onDragEnd: ({ over }) => (over ? `Posé le ${jourLong(String(over.id))}` : 'Déplacement annulé'),
            onDragCancel: () => 'Déplacement annulé',
          },
        }}
      >
        <div className="grid gap-2.5 ecran:grid-cols-7">
          {jours.map((jour, i) => (
            <Jour
              key={jour}
              jour={jour}
              etiquette={ETIQUETTES[i]}
              rang={i}
              aujourdhui={jour === aujourdhui}
              passe={jour < aujourdhui}
              off={off.has(jour)}
              contenus={parJour.get(jour) ?? []}
              surOuvrir={setOuvert}
              surAjouter={() => setAjoutLe(jour)}
              surBasculerOff={() => basculerOff(jour)}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
          {enMain && (
            <div className="rotate-2 scale-[1.04] shadow-survol">
              <Puce contenu={enMain} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {ouvert && (
          <FeuilleContenu
            key={ouvert.id}
            contenu={ouvert}
            jours={jours}
            surModifier={modifier}
            surRetirer={(id) => setContenus((l) => l.filter((c) => c.id !== id))}
            surFermer={() => setOuvert(null)}
          />
        )}
        {ajoutLe && (
          <FeuilleAjout
            key={ajoutLe}
            jour={ajoutLe}
            candidats={candidats.filter((c) => !contenus.some((p) => p.sujetId === c.id))}
            surAjout={(c) =>
              setContenus((l) => [
                ...l,
                { id: `local-${c.id}`, jour: ajoutLe, heure: null, sujetId: c.id, ficheId: null, titre: c.titre, format: c.format, pilier: c.pilier, theme: c.theme, publie: false },
              ])
            }
            surFermer={() => setAjoutLe(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

function LienSemaine({ href, libelle, children }: { href: string; libelle: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={libelle}
      className="grid size-11 place-items-center rounded-full border border-creme/22 bg-creme/10 text-creme no-underline hover:text-creme"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </Link>
  )
}

// Un jour : on y dépose les contenus. Jour off : fond poudré, pointillés, lune dorée.
function Jour({
  jour,
  etiquette,
  rang,
  aujourdhui,
  passe,
  off,
  contenus,
  surOuvrir,
  surAjouter,
  surBasculerOff,
}: {
  jour: string
  etiquette: string
  rang: number
  aujourdhui: boolean
  passe: boolean
  off: boolean
  contenus: ContenuPlanning[]
  surOuvrir: (c: ContenuPlanning) => void
  surAjouter: () => void
  surBasculerOff: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: jour })
  const numero = date(jour).getUTCDate()

  return (
    <motion.section
      ref={setNodeRef}
      aria-label={jourLong(jour)}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + rang * 0.05, duration: 0.6, ease: COURBES.power3 }}
      className={`flex min-h-[96px] flex-col gap-2.5 rounded-[22px] border p-3 transition-[background-color,border-color,box-shadow] duration-200 ecran:min-h-[340px] ${
        isOver
          ? 'border-or bg-poudre shadow-focus-or'
          : off
            ? 'border-dashed border-bordeaux/25 bg-poudre'
            : aujourdhui
              ? 'border-bordeaux bg-surface'
              : 'border-ligne bg-surface'
      } ${passe && !isOver ? 'opacity-75' : ''}`}
    >
      <header className="flex items-center gap-2">
        <div className="flex items-baseline gap-1.5">
          <small className="text-[11px] uppercase tracking-[0.06em] text-texte-doux">{etiquette}</small>
          <b className="font-titre text-xl font-medium leading-none">{numero}</b>
        </div>
        {aujourdhui && <span className="rounded-full bg-bordeaux px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-creme">Aujourd’hui</span>}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={surBasculerOff}
            aria-pressed={off}
            aria-label={off ? `Retirer le jour off du ${jourLong(jour)}` : `Faire du ${jourLong(jour)} un jour off`}
            className={`grid size-9 place-items-center rounded-full transition-colors ${off ? 'bg-or text-bordeaux-profond' : 'text-texte-doux hover:bg-poudre hover:text-bordeaux'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={off ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={surAjouter}
            aria-label={`Ajouter un sujet le ${jourLong(jour)}`}
            className="grid size-9 place-items-center rounded-full text-texte-doux transition-colors hover:bg-poudre hover:text-bordeaux"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {contenus.map((c) => (
          <PuceDeplacable key={c.id} contenu={c} surOuvrir={surOuvrir} />
        ))}
        {contenus.length === 0 && (
          <p className="py-1 text-[13px] italic text-texte-doux">{off ? 'Jour off. Repose-toi, tu l’as mérité.' : 'Rien de prévu.'}</p>
        )}
      </div>
    </motion.section>
  )
}

function PuceDeplacable({ contenu, surOuvrir }: { contenu: ContenuPlanning; surOuvrir: (c: ContenuPlanning) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contenu.id, disabled: contenu.id.startsWith('local-') })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-roledescription="contenu déplaçable"
      aria-label={`${contenu.titre}${contenu.heure ? `, à ${contenu.heure}` : ''}${contenu.publie ? ', publié' : ''}. Toucher pour gérer, appui long pour déplacer.`}
      onClick={() => surOuvrir(contenu)}
      className={`block w-full touch-manipulation text-left transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      <Puce contenu={contenu} />
    </button>
  )
}

function Puce({ contenu }: { contenu: ContenuPlanning }) {
  const format = nomFormat(contenu.format)
  return (
    <span className={`grain relative flex flex-col gap-1.5 overflow-hidden rounded-[16px] p-3 ${ART[contenu.pilier]}`}>
      <span className="relative z-[2] flex items-center justify-between gap-2 text-[11px] text-(--sub)">
        <span>{contenu.heure ?? 'À caler'}</span>
        {contenu.publie && (
          <span className="inline-flex items-center gap-1 rounded-full bg-(--chip) px-2 py-0.5 font-semibold">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Publié
          </span>
        )}
      </span>
      <span className="relative z-[2] line-clamp-3 font-titre text-[17px] font-medium leading-[1.15]">{contenu.titre}</span>
      {format && <span className="relative z-[2] self-start rounded-full bg-(--chip) px-2 py-0.5 text-[11px]">{format}</span>}
    </span>
  )
}

// Gérer un contenu : heure, jour, publication, fiche, retrait
function FeuilleContenu({
  contenu,
  jours,
  surModifier,
  surRetirer,
  surFermer,
}: {
  contenu: ContenuPlanning
  jours: string[]
  surModifier: (id: string, c: Partial<ContenuPlanning>) => void
  surRetirer: (id: string) => void
  surFermer: () => void
}) {
  const toast = useToast()
  const [heure, setHeure] = useState(contenu.heure ?? '')
  const enAttente = contenu.id.startsWith('local-')

  async function enregistrerHeure(valeur: string | null) {
    surModifier(contenu.id, { heure: valeur })
    toast(valeur ? `Prévu à ${valeur}` : 'Heure retirée : à caler quand tu veux')
    const { ok } = await changerHeure(contenu.id, valeur)
    if (!ok) toast('L’heure n’a pas pu être enregistrée. Réessaie.', 'erreur')
  }

  async function deplacer(jour: string) {
    const ancien = contenu.jour
    surModifier(contenu.id, { jour })
    toast(`Déplacé à ${jourLong(jour)}`)
    surFermer()
    const { ok } = await deplacerContenu(contenu.id, jour)
    if (!ok) {
      surModifier(contenu.id, { jour: ancien })
      toast('Ce contenu n’a pas pu changer de jour. Réessaie.', 'erreur')
    }
  }

  async function publier(e: React.MouseEvent<HTMLButtonElement>) {
    surModifier(contenu.id, { publie: true })
    gerbe(e.currentTarget, true)
    vibrer(30)
    toast('Bravo ! Une vidéo de plus dans ta série.')
    const { ok } = await marquerPublie(contenu.sujetId)
    if (!ok) {
      surModifier(contenu.id, { publie: false })
      toast('Ça n’a pas marché cette fois. Réessaie.', 'erreur')
    }
  }

  async function retirer() {
    surRetirer(contenu.id)
    surFermer()
    toast('Retiré du planning. Le sujet reste dans ta Bibliothèque.')
    const { ok } = await retirerContenu(contenu.id)
    if (!ok) toast('Ce contenu n’a pas pu être retiré. Réessaie.', 'erreur')
  }

  const semaineSuivante = decalerJour(contenu.jour, 7)

  return (
    <Feuille titre={contenu.titre} surFermer={surFermer}>
      <p className="surtitre text-bordeaux">
        {NOMS_PILIERS[contenu.pilier]}
        {contenu.theme ? ` · ${contenu.theme}` : ''}
      </p>
      <h2 className="mt-1.5 font-titre text-[clamp(24px,6.5vw,30px)] italic leading-[1.1]">{contenu.titre}</h2>
      <p className="mt-1 text-sm text-texte-doux first-letter:uppercase">{jourLong(contenu.jour)}</p>

      {enAttente ? (
        <p className="mt-5 text-sm text-texte-doux">J’enregistre ce contenu… encore une seconde.</p>
      ) : (
        <>
          <section className="mt-5">
            <h3 className="surtitre text-texte-doux">Heure</h3>
            <div className="mt-2 flex gap-2">
              <label htmlFor="heure-contenu" className="sr-only">
                Heure de publication
              </label>
              <input
                id="heure-contenu"
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                className="min-h-12 min-w-0 flex-1 rounded-[16px] border border-ligne bg-surface px-4 text-base outline-none focus:border-bordeaux focus:shadow-focus"
              />
              <button
                type="button"
                onClick={() => enregistrerHeure(heure || null)}
                className="min-h-12 rounded-[16px] bg-bordeaux px-4 text-sm font-semibold text-creme"
              >
                Enregistrer
              </button>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="surtitre text-texte-doux">Changer de jour</h3>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {jours.map((j, i) => (
                <button
                  key={j}
                  type="button"
                  disabled={j === contenu.jour}
                  onClick={() => deplacer(j)}
                  aria-label={jourLong(j)}
                  className="flex min-h-14 flex-col items-center justify-center rounded-[14px] border border-ligne bg-surface text-xs transition-colors hover:border-bordeaux disabled:border-bordeaux disabled:bg-bordeaux disabled:text-creme"
                >
                  <span className="uppercase tracking-[0.04em] opacity-70">{ETIQUETTES[i]}</span>
                  <b className="font-titre text-base font-medium">{date(j).getUTCDate()}</b>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => deplacer(semaineSuivante)}
              className="mt-2 min-h-11 w-full rounded-[14px] border border-ligne text-sm font-medium hover:border-bordeaux"
            >
              Repousser d’une semaine ({jourLong(semaineSuivante)})
            </button>
          </section>

          <div className="mt-6 flex flex-col gap-2">
            {!contenu.publie && (
              <button type="button" onClick={publier} className="fond-bouton reflet min-h-14 rounded-[18px] text-[15px] font-semibold text-creme shadow-bouton">
                <span className="relative">C’est publié !</span>
              </button>
            )}
            <div className="flex gap-2">
              {contenu.ficheId && (
                <Link
                  href={`/teleprompteur/${contenu.ficheId}`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-[16px] border border-ligne text-sm font-medium text-texte no-underline hover:border-bordeaux"
                >
                  Téléprompteur
                </Link>
              )}
              <Link
                href={`/sujets/${contenu.sujetId}`}
                className="flex min-h-12 flex-1 items-center justify-center rounded-[16px] border border-ligne text-sm font-medium text-texte no-underline hover:border-bordeaux"
              >
                Ouvrir la fiche
              </Link>
            </div>
            <button type="button" onClick={retirer} className="min-h-11 text-sm font-medium text-erreur">
              Retirer du planning
            </button>
          </div>
        </>
      )}
    </Feuille>
  )
}

// Ajouter un sujet de la banque à un jour
function FeuilleAjout({
  jour,
  candidats,
  surAjout,
  surFermer,
}: {
  jour: string
  candidats: Candidat[]
  surAjout: (c: Candidat) => void
  surFermer: () => void
}) {
  const toast = useToast()
  const [recherche, setRecherche] = useState('')
  const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const visibles = candidats.filter((c) => !recherche || normaliser(`${c.titre} ${c.theme ?? ''}`).includes(normaliser(recherche))).slice(0, 40)

  async function ajouter(c: Candidat) {
    surAjout(c)
    surFermer()
    vibrer(15)
    toast(`« ${c.titre} » prévu ${jourLong(jour)}`)
    const { ok } = await planifierLe(c.id, jour)
    if (!ok) toast('Ce sujet n’a pas pu être ajouté. Réessaie.', 'erreur')
  }

  return (
    <Feuille titre={`Ajouter un sujet le ${jourLong(jour)}`} surFermer={surFermer}>
      <h2 className="font-titre text-[clamp(24px,6.5vw,30px)] italic leading-[1.1] first-letter:uppercase">{jourLong(jour)}</h2>
      <p className="mt-1 text-sm text-texte-doux">Quel sujet veux-tu tourner ou publier ce jour-là ?</p>
      <label htmlFor="recherche-ajout" className="sr-only">
        Rechercher un sujet
      </label>
      <input
        id="recherche-ajout"
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="confiance, routine, anglais…"
        className="mt-4 min-h-12 w-full rounded-[16px] border border-ligne bg-surface px-4 text-base outline-none placeholder:text-texte-doux focus:border-bordeaux focus:shadow-focus"
      />
      <ul className="mt-3 flex flex-col gap-2">
        {visibles.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => ajouter(c)}
              className="flex w-full items-center gap-3 rounded-[16px] border border-ligne bg-surface px-4 py-3 text-left transition-colors hover:border-bordeaux"
            >
              <span aria-hidden="true" className={`size-3 flex-none rounded-full ${ART[c.pilier]}`} />
              <span className="min-w-0 flex-1">
                <span className="block font-titre text-[17px] leading-tight">{c.titre}</span>
                <span className="block text-xs text-texte-doux">
                  {c.theme ?? 'Sans thème'}
                  {nomFormat(c.format) ? ` · ${nomFormat(c.format)}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
        {visibles.length === 0 && (
          <li className="py-6 text-center text-sm text-texte-doux">
            {candidats.length === 0 ? 'Tous tes sujets sont déjà prévus. Ajoute des idées dans ta Bibliothèque !' : 'Rien trouvé avec ce mot.'}
          </li>
        )}
      </ul>
    </Feuille>
  )
}
