'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { COURBES } from '@/lib/animation'
import { gerbe, vibrer } from '@/lib/confettis'
import { ART, NOMS_PILIERS, nomFormat } from '@/lib/contenu'
import type { Bulle, Proposition } from '@/lib/agent/conversation'
import { creerIdee } from '@/app/sujets/actions'
import Avatar from '../ui/Avatar'
import { Etincelle } from '../ui/Bouton'
import Couverture from '../ui/Couverture'
import { useToast } from '../ui/Toast'

type Props = {
  conversationId: string | null
  bulles: Bulle[]
  conversations: { id: string; titre: string }[]
  themes: { id: string; nom: string }[]
  titresExistants: string[]
  photo: string
  memoireAbsente: boolean
}

// Pour démarrer sans page blanche
const IDEES_DE_DEPART = [
  'Trouve-moi 3 idées de Talk sur la confiance en soi',
  'Un épisode One Girl, Many Lives pour cette semaine',
  'Des sujets pour équilibrer mes trois piliers',
  'Comment parler de mon apprentissage de l’anglais ?',
]

const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

type BulleAffichee = Bulle & { enCours?: boolean; erreur?: boolean; preparation?: boolean }
type BulleDeLAgent = Extract<BulleAffichee, { role: 'agent' }>

export default function Agent({ conversationId: idInitial, bulles: initiales, conversations, themes, titresExistants, photo, memoireAbsente }: Props) {
  const [bulles, setBulles] = useState<BulleAffichee[]>(initiales)
  const [conversationId, setConversationId] = useState(idInitial)
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [sansMemoire, setSansMemoire] = useState(memoireAbsente)
  const [dansLaBanque, setDansLaBanque] = useState(() => new Set(titresExistants.map(normaliser)))
  const zone = useRef<HTMLTextAreaElement>(null)
  const fin = useRef<HTMLDivElement>(null)

  // Le dernier message reste visible pendant que la réponse s'écrit
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [bulles])

  // Le champ grandit avec le texte
  useEffect(() => {
    const z = zone.current
    if (!z) return
    z.style.height = 'auto'
    z.style.height = `${Math.min(z.scrollHeight, 140)}px`
  }, [saisie])

  const majDerniere = (changement: (b: BulleAffichee) => BulleAffichee) =>
    setBulles((liste) => liste.map((b, i) => (i === liste.length - 1 ? changement(b) : b)))

  async function envoyer(texte: string) {
    const message = texte.trim()
    if (!message || enCours) return
    setSaisie('')
    setEnCours(true)
    vibrer(8)
    setBulles((l) => [...l, { role: 'moi', texte: message }, { role: 'agent', texte: '', propositions: [], enCours: true }])

    try {
      const reponse = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId }),
      })
      if (!reponse.ok || !reponse.body) {
        const corps = await reponse.json().catch(() => ({}))
        if (corps.erreur === 'memoire_absente') setSansMemoire(true)
        throw new Error(corps.erreur === 'memoire_absente' ? 'Ma mémoire n’est pas encore installée : lance le fichier SQL des conversations.' : corps.erreur)
      }

      // Lecture du flux : une ligne JSON par évènement
      const lecteur = reponse.body.getReader()
      const decodeur = new TextDecoder()
      let reste = ''
      while (true) {
        const { value, done } = await lecteur.read()
        if (done) break
        reste += decodeur.decode(value, { stream: true })
        const lignes = reste.split('\n')
        reste = lignes.pop() ?? ''
        for (const l of lignes) {
          if (!l.trim()) continue
          const ev = JSON.parse(l)
          if (ev.t === 'texte') majDerniere((b) => ({ ...b, texte: b.texte + ev.d }))
          else if (ev.t === 'preparation') majDerniere((b) => ({ ...b, preparation: true }))
          else if (ev.t === 'propositions') {
            majDerniere((b) => (b.role === 'agent' ? { ...b, propositions: ev.sujets, preparation: false } : b))
            vibrer(15)
          } else if (ev.t === 'memoire_absente') setSansMemoire(true)
          else if (ev.t === 'erreur') majDerniere((b) => ({ ...b, texte: ev.message, erreur: true }))
          else if (ev.t === 'fin' && ev.conversationId) {
            setConversationId(ev.conversationId)
            window.history.replaceState(null, '', `/ia?c=${ev.conversationId}`)
          }
        }
      }
    } catch (e) {
      majDerniere((b) => ({
        ...b,
        texte: e instanceof Error && e.message ? e.message : 'Je n’ai pas réussi à te répondre. Vérifie ta connexion et réessaie.',
        erreur: true,
      }))
    } finally {
      majDerniere((b) => ({ ...b, enCours: false, preparation: false }))
      setEnCours(false)
    }
  }

  function soumettre(e: FormEvent) {
    e.preventDefault()
    envoyer(saisie)
  }

  const marquerAjoutee = (titre: string) => setDansLaBanque((s) => new Set(s).add(normaliser(titre)))

  return (
    <main className="relative mx-auto max-w-[860px] px-4 pt-[calc(18px+env(safe-area-inset-top,0px))] pb-[230px] max-[360px]:px-3">
      <Couverture aria-label="Ton agent IA" className="carte:pb-7">
        <div className="flex items-center gap-3">
          <Avatar src={photo} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-sur-bordeaux">Ton agent IA</p>
            <h1 className="font-titre text-[clamp(28px,8cqi,44px)] font-normal italic leading-[1.05]">On crée ensemble ?</h1>
          </div>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] text-sur-bordeaux">
          Demande-moi des idées, un hook, un angle. Mes propositions arrivent en cartes : un geste et elles rejoignent ta banque.
        </p>
        {(conversations.length > 0 || conversationId) && (
          <nav aria-label="Tes conversations" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/ia"
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm no-underline ${
                conversationId ? 'border-creme/25 bg-creme/10 text-creme hover:text-creme' : 'border-creme bg-creme font-semibold text-bordeaux hover:text-bordeaux'
              }`}
            >
              <span aria-hidden="true">+</span> Nouvelle
            </Link>
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/ia?c=${c.id}`}
                className={`inline-flex min-h-10 max-w-[220px] shrink-0 items-center rounded-full border px-3.5 text-sm no-underline ${
                  c.id === conversationId ? 'border-creme bg-creme font-semibold text-bordeaux hover:text-bordeaux' : 'border-creme/25 bg-creme/10 text-creme hover:text-creme'
                }`}
              >
                <span className="truncate">{c.titre}</span>
              </Link>
            ))}
          </nav>
        )}
      </Couverture>

      {sansMemoire && (
        <p role="status" className="mt-4 rounded-[18px] border border-or/40 bg-poudre px-4 py-3 text-sm text-bordeaux">
          Ma mémoire n’est pas encore installée : lance le fichier <b>20261013_conversations_agent.sql</b> dans Supabase pour que je me souvienne de nos échanges.
        </p>
      )}

      {bulles.length === 0 ? (
        <section className="mt-8">
          <h2 className="mx-1 font-titre text-[clamp(24px,6.5vw,30px)] italic">Par où on commence ?</h2>
          <div className="mt-3.5 grid gap-2.5 carte:grid-cols-2">
            {IDEES_DE_DEPART.map((idee, i) => (
              <motion.button
                key={idee}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: COURBES.power3 }}
                onClick={() => envoyer(idee)}
                className="flex min-h-14 items-center gap-3 rounded-[20px] border border-ligne bg-surface px-4 py-3 text-left text-[15px] shadow-carte transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Etincelle taille={18} className="flex-none text-or-profond" />
                {idee}
              </motion.button>
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-6 flex flex-col gap-5" aria-live="polite">
          {bulles.map((b, i) =>
            b.role === 'moi' ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-auto max-w-[85%] rounded-[22px] rounded-tr-md bg-bordeaux px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-creme"
              >
                {b.texte}
              </motion.div>
            ) : (
              <BulleAgent key={i} bulle={b} themes={themes} dansLaBanque={dansLaBanque} surAjout={marquerAjoutee} />
            )
          )}
        </div>
      )}
      <div ref={fin} />

      {/* Barre de saisie, au-dessus de la navigation */}
      <form
        onSubmit={soumettre}
        className="fixed inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom,0px))] z-20 mx-auto flex max-w-[760px] items-end gap-2 rounded-[26px] border border-ligne bg-surface p-2 shadow-nav"
      >
        <label htmlFor="message-agent" className="sr-only">
          Ton message
        </label>
        <textarea
          id="message-agent"
          ref={zone}
          rows={1}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
              e.preventDefault()
              envoyer(saisie)
            }
          }}
          placeholder="Demande-moi une idée, un hook…"
          className="max-h-[140px] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-snug text-texte outline-none placeholder:text-texte-doux"
        />
        <button
          type="submit"
          disabled={enCours || !saisie.trim()}
          aria-label="Envoyer"
          className="grid size-11 flex-none place-items-center rounded-full bg-bordeaux text-creme transition-[opacity,transform] active:scale-95 disabled:opacity-40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </main>
  )
}

function BulleAgent({
  bulle,
  themes,
  dansLaBanque,
  surAjout,
}: {
  bulle: BulleDeLAgent
  themes: { id: string; nom: string }[]
  dansLaBanque: Set<string>
  surAjout: (titre: string) => void
}) {
  const attente = bulle.enCours && !bulle.texte && !bulle.preparation
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-full gap-2.5">
      <span aria-hidden="true" className="fond-bouton mt-1 grid size-8 flex-none place-items-center rounded-full text-or shadow-bouton">
        <Etincelle taille={16} />
      </span>
      <div className="min-w-0 flex-1">
        {(bulle.texte || attente) && (
          <div
            className={`inline-block max-w-full rounded-[22px] rounded-tl-md border px-4 py-3 text-[15px] leading-relaxed ${
              bulle.erreur ? 'border-erreur/30 bg-poudre text-bordeaux' : 'border-ligne bg-surface'
            }`}
          >
            {attente ? <Points /> : <TexteMisEnForme texte={bulle.texte} />}
            {bulle.enCours && bulle.texte && (
              <motion.span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] bg-or-profond"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            )}
          </div>
        )}
        {bulle.preparation && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-texte-doux">
            <Points /> Je prépare tes cartes…
          </p>
        )}
        {bulle.propositions.length > 0 && (
          <div className="mt-3 grid gap-2.5 carte:grid-cols-2">
            {bulle.propositions.map((p, i) => (
              <CarteProposition
                key={`${p.titre}-${i}`}
                proposition={p}
                rang={i}
                themeId={themes.find((t) => normaliser(t.nom) === normaliser(p.theme))?.id ?? null}
                deja={dansLaBanque.has(normaliser(p.titre))}
                surAjout={surAjout}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CarteProposition({
  proposition: p,
  rang,
  themeId,
  deja,
  surAjout,
}: {
  proposition: Proposition
  rang: number
  themeId: string | null
  deja: boolean
  surAjout: (titre: string) => void
}) {
  const toast = useToast()
  const router = useRouter()
  const [envoi, setEnvoi] = useState(false)

  async function ajouter(e: React.MouseEvent<HTMLButtonElement>, ouvrir: boolean) {
    const bouton = e.currentTarget
    setEnvoi(true)
    const { ok, id } = await creerIdee(p.titre, themeId, p.format, 'agent')
    setEnvoi(false)
    if (!ok) return toast('Cette idée n’a pas pu rejoindre ta banque. Réessaie.', 'erreur')
    surAjout(p.titre)
    gerbe(bouton)
    vibrer(20)
    toast(`« ${p.titre} » est dans ta banque`)
    if (ouvrir && id) router.push(`/sujets/${id}`)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: rang * 0.08, duration: 0.5, ease: COURBES.power3 }}
      className={`grain relative flex flex-col gap-3 overflow-hidden rounded-carte p-4 ${ART[p.pilier]}`}
    >
      <div className="relative z-[2]">
        <p className="surtitre text-(--sub)">
          {NOMS_PILIERS[p.pilier]}
          {p.theme ? ` · ${p.theme}` : ''}
        </p>
        <h3 className="mt-1.5 font-titre text-[21px] font-medium leading-[1.12]">{p.titre}</h3>
        {p.accroche && <p className="mt-2 font-titre text-[16px] italic leading-snug">« {p.accroche} »</p>}
        {p.pourquoi && <p className="mt-2 text-[13px] leading-snug text-(--sub)">{p.pourquoi}</p>}
      </div>
      <div className="relative z-[2] flex flex-wrap items-center gap-2">
        {nomFormat(p.format) && <span className="rounded-full bg-(--chip) px-2.5 py-1 text-xs">{nomFormat(p.format)}</span>}
      </div>
      {deja ? (
        <p className="relative z-[2] flex items-center gap-2 text-sm font-semibold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Dans ta banque
        </p>
      ) : (
        <div className="relative z-[2] flex gap-2">
          <button
            type="button"
            disabled={envoi}
            onClick={(e) => ajouter(e, true)}
            className="min-h-11 flex-1 rounded-petit border border-(--line-c) text-sm font-medium transition-transform active:scale-[0.96] disabled:opacity-60"
          >
            Développer
          </button>
          <button
            type="button"
            disabled={envoi}
            onClick={(e) => ajouter(e, false)}
            className="min-h-11 flex-[1.4] rounded-petit bg-(--btn) text-sm font-semibold text-(--btn-ink) transition-transform active:scale-[0.96] disabled:opacity-60"
          >
            {envoi ? 'J’ajoute…' : 'Ajouter à ma banque'}
          </button>
        </div>
      )}
    </motion.article>
  )
}

function Points() {
  return (
    <span aria-label="L’agent réfléchit" role="status" className="inline-flex gap-1 py-1.5">
      {[0, 1, 2].map((i) => (
        <motion.i
          key={i}
          className="block size-1.5 rounded-full bg-or-profond"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}

// Mise en forme légère : paragraphes, listes à puces, **gras**
function TexteMisEnForme({ texte }: { texte: string }) {
  const enGras = (ligne: string): ReactNode[] =>
    ligne.split(/(\*\*[^*]+\*\*)/g).map((m, i) => (m.startsWith('**') && m.endsWith('**') ? <strong key={i}>{m.slice(2, -2)}</strong> : m))

  return (
    <>
      {texte.split(/\n{2,}/).map((bloc, i) => {
        const lignes = bloc.split('\n')
        if (lignes.every((l) => /^\s*[-•*]\s+/.test(l))) {
          return (
            <ul key={i} className="my-1 list-disc space-y-1 pl-5">
              {lignes.map((l, j) => (
                <li key={j}>{enGras(l.replace(/^\s*[-•*]\s+/, ''))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className={i ? 'mt-2.5' : ''}>
            {lignes.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {enGras(l)}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}
