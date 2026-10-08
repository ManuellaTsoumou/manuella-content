'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { enregistrerIdee } from '@/app/actions'
import { useToast } from '../ui/Toast'

// La dictée du navigateur (Chrome, Edge, Safari récent). Types minimaux : elle n'est pas dans TypeScript.
type ResultatDictee = { isFinal: boolean; 0: { transcript: string } }
type Dictee = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ResultatDictee> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type ConstructeurDictee = new () => Dictee

function trouverDictee(): ConstructeurDictee | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: ConstructeurDictee; webkitSpeechRecognition?: ConstructeurDictee }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// expo.inOut de GSAP
const EXPO_IN_OUT = [0.87, 0, 0.13, 1] as const
const BARRES = 26

type Props = {
  // Appelé à la fermeture ; « enregistree » déclenche les confettis sur le bouton
  surFermer: (enregistree: boolean) => void
}

// L'écran « Je t'écoute… » : plein écran bordeaux, micro qui pulse, onde dorée, minuteur.
export default function IdeeVocale({ surFermer }: Props) {
  const toast = useToast()
  const reduit = useReducedMotion()
  const dictee = useRef<Dictee | null>(null)
  const ouverte = useRef(true)
  const boutonGarder = useRef<HTMLButtonElement>(null)
  const zoneTexte = useRef<HTMLTextAreaElement>(null)

  const [mode, setMode] = useState<'voix' | 'texte'>(() => (trouverDictee() ? 'voix' : 'texte'))
  const [raison, setRaison] = useState<string | null>(null)
  const [entendu, setEntendu] = useState('')
  const [enCours, setEnCours] = useState('')
  const [texte, setTexte] = useState('')
  const [secondes, setSecondes] = useState(0)
  const [fermeture, setFermeture] = useState(false)
  const [envoi, setEnvoi] = useState(false)

  // Minuteur, défilement bloqué, Échap pour fermer
  useEffect(() => {
    const minuterie = setInterval(() => setSecondes((s) => s + 1), 1000)
    document.body.style.overflow = 'hidden'
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && fermer(false)
    document.addEventListener('keydown', echap)
    return () => {
      ouverte.current = false
      clearInterval(minuterie)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', echap)
      dictee.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Démarre la dictée ; en cas de refus du micro, on passe au champ texte
  useEffect(() => {
    if (mode !== 'voix') {
      setTimeout(() => zoneTexte.current?.focus({ preventScroll: true }), 300)
      return
    }
    const Constructeur = trouverDictee()
    if (!Constructeur) return
    const d = new Constructeur()
    d.lang = 'fr-FR'
    d.continuous = true
    d.interimResults = true
    d.onresult = (e) => {
      let provisoire = ''
      let definitif = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) definitif += r[0].transcript
        else provisoire += r[0].transcript
      }
      if (definitif) setEntendu((t) => `${t} ${definitif}`.trim())
      setEnCours(provisoire)
    }
    d.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setRaison(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'Le micro n’est pas autorisé ici : écris ton idée, on la rangera ensuite.'
          : 'La dictée n’a pas fonctionné : écris ton idée, on la rangera ensuite.'
      )
      setMode('texte')
    }
    // Sur téléphone, la dictée s'arrête après un silence : on la relance tant que l'écran est ouvert
    d.onend = () => {
      if (ouverte.current && dictee.current === d) {
        try {
          d.start()
        } catch {}
      }
    }
    dictee.current = d
    try {
      d.start()
    } catch {
      // Dictée impossible à lancer : on bascule sur le champ texte juste après ce rendu
      queueMicrotask(() => setMode('texte'))
    }
    boutonGarder.current?.focus({ preventScroll: true })
    return () => {
      dictee.current = null
      d.abort()
    }
  }, [mode])

  function fermer(enregistree: boolean) {
    if (fermeture) return
    setFermeture(true)
    dictee.current = null
    setTimeout(() => surFermer(enregistree), reduit ? 0 : 300)
  }

  async function garder() {
    const idee = (mode === 'voix' ? `${entendu} ${enCours}` : texte).trim()
    if (!idee) {
      toast(mode === 'voix' ? 'Je n’ai encore rien entendu. Parle-moi de ton idée !' : 'Écris ton idée avant de la garder.', 'info')
      return
    }
    setEnvoi(true)
    const { ok } = await enregistrerIdee(idee)
    setEnvoi(false)
    if (!ok) {
      toast('Ton idée n’a pas pu être enregistrée. Réessaie.', 'erreur')
      return
    }
    toast(mode === 'voix' ? `Idée enregistrée (${secondes} s). Je la transforme en sujet.` : 'Idée enregistrée. Je la transforme en sujet.')
    fermer(true)
  }

  const minutes = String(Math.floor(secondes / 60)).padStart(2, '0')
  const sec = String(secondes % 60).padStart(2, '0')

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-idee"
      initial={{ clipPath: 'circle(0% at 25% 85%)' }}
      animate={fermeture ? { opacity: 0 } : { clipPath: 'circle(150% at 25% 85%)' }}
      transition={fermeture ? { duration: 0.3 } : { duration: reduit ? 0 : 0.7, ease: EXPO_IN_OUT }}
      className="fond-couverture grain fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 overflow-y-auto px-6 pt-[calc(24px+env(safe-area-inset-top,0px))] pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-center text-blanc"
    >
      <h2 id="titre-idee" className="relative z-[2] font-titre text-[clamp(30px,8vw,48px)] font-normal italic">
        {mode === 'voix' ? 'Je t’écoute…' : 'Note ton idée'}
      </h2>
      <p className="relative z-[2] max-w-[420px] text-sur-bordeaux">
        {mode === 'voix'
          ? 'Dis ton idée comme elle vient. On la rangera ensuite.'
          : (raison ?? 'La dictée n’est pas disponible sur ce navigateur : écris ton idée, on la rangera ensuite.')}
      </p>

      {mode === 'voix' ? (
        <>
          <div aria-hidden="true" className="relative z-[2] grid size-[120px] place-items-center rounded-full bg-blanc text-bordeaux">
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-or/70"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut', repeat: Infinity, delay: i }}
              />
            ))}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </div>
          <div aria-hidden="true" className="relative z-[2] flex h-[60px] items-center gap-1">
            {Array.from({ length: BARRES }, (_, i) => {
              // Hauteurs pseudo-aléatoires mais stables d'un rendu à l'autre
              const h = (n: number) => 10 + Math.abs(Math.sin(i * 12.9898 + n * 78.233)) * 46
              return (
                <motion.i
                  key={i}
                  className="block w-[5px] rounded-full bg-or"
                  initial={{ height: 12 }}
                  animate={{ height: [h(1), h(2), h(3), h(4)] }}
                  transition={{
                    duration: 1 + (i % 5) * 0.2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: i * 0.02,
                  }}
                />
              )
            })}
          </div>
          <div className="relative z-[2] font-titre text-[28px] tracking-[0.06em]" aria-label={`Durée : ${secondes} secondes`}>
            {minutes}:{sec}
          </div>
          {(entendu || enCours) && (
            <p aria-live="polite" className="relative z-[2] max-w-[420px] font-titre text-lg italic text-citation">
              « {entendu} <span className="opacity-60">{enCours}</span> »
            </p>
          )}
        </>
      ) : (
        <div className="relative z-[2] w-[min(420px,100%)]">
          <label htmlFor="idee-texte" className="sr-only">
            Ton idée
          </label>
          <textarea
            id="idee-texte"
            ref={zoneTexte}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="Ex. Ce que j’aurais aimé savoir sur la confiance à 18 ans"
            className="w-full resize-none rounded-[18px] border border-creme/30 bg-creme/10 p-4 text-base text-blanc outline-none placeholder:text-sur-bordeaux/70 focus:border-or focus:shadow-focus-or"
          />
        </div>
      )}

      <div className="relative z-[2] flex w-[min(360px,100%)] gap-2.5">
        <button
          type="button"
          onClick={() => fermer(false)}
          className="min-h-14 flex-1 rounded-[18px] border border-creme/40 bg-transparent text-[15px] font-semibold text-blanc"
        >
          Annuler
        </button>
        <button
          ref={boutonGarder}
          type="button"
          onClick={garder}
          disabled={envoi}
          className="min-h-14 flex-[1.3] rounded-[18px] bg-blanc text-[15px] font-semibold text-bordeaux disabled:opacity-70"
        >
          {envoi ? 'Je range…' : 'Garder l’idée'}
        </button>
      </div>
    </motion.section>
  )
}
