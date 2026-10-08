'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { vibrer } from '@/lib/confettis'
import Bouton, { Etincelle } from '../composants/ui/Bouton'
import Champ from '../composants/ui/Champ'
import CadreConnexion, { Entree } from './CadreConnexion'
import EcranReussite from './EcranReussite'

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Message = { texte: string; ton: 'erreur' | 'info' } | null

export default function Connexion() {
  const router = useRouter()
  const reduit = useReducedMotion()
  const [feuille, animer] = useAnimate<HTMLDivElement>()
  const champEmail = useRef<HTMLInputElement>(null)
  const champMotDePasse = useRef<HTMLInputElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [invalides, setInvalides] = useState({ email: false, motDePasse: false })
  const [message, setMessage] = useState<Message>(null)
  const [chargement, setChargement] = useState(false)
  const [reussite, setReussite] = useState<{ x: number; y: number } | null>(null)

  // L'accueil se prépare pendant l'animation de réussite, puis prend le relais
  useEffect(() => {
    if (!reussite) return
    router.prefetch('/')
    const suite = setTimeout(() => {
      router.push('/')
      router.refresh()
    }, reduit ? 600 : 2600)
    return () => clearTimeout(suite)
  }, [reussite, reduit, router])

  function trembler() {
    vibrer([30, 40, 30])
    if (!reduit && feuille.current) {
      animer(feuille.current, { x: [0, -12, 10, -8, 6, -3, 0] }, { duration: 0.5, ease: 'easeOut' })
    }
  }

  async function seConnecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const adresse = email.trim()
    const emailOk = EMAIL_VALIDE.test(adresse)
    const motDePasseOk = motDePasse.length >= 6
    setInvalides({ email: !emailOk, motDePasse: !motDePasseOk })

    if (!emailOk || !motDePasseOk) {
      setMessage({
        ton: 'erreur',
        texte: !emailOk
          ? 'Oups, cette adresse e-mail ne semble pas complète. On réessaie ?'
          : 'Ton mot de passe doit faire au moins 6 caractères.',
      })
      trembler()
      ;(!emailOk ? champEmail : champMotDePasse).current?.focus()
      return
    }

    setMessage(null)
    setChargement(true)
    vibrer(12)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: adresse, password: motDePasse })

    if (error) {
      setChargement(false)
      setInvalides({ email: false, motDePasse: true })
      setMessage({
        ton: 'erreur',
        texte: 'Cet e-mail et ce mot de passe ne vont pas ensemble. Vérifie-les, on réessaie ?',
      })
      trembler()
      champMotDePasse.current?.focus()
      return
    }

    // Le cercle bordeaux s'ouvrira depuis le centre du bouton
    const r = bouton.current?.getBoundingClientRect()
    vibrer(30)
    setReussite({
      x: r ? r.left + r.width / 2 : window.innerWidth / 2,
      y: r ? r.top + r.height / 2 : window.innerHeight / 2,
    })
  }

  async function motDePasseOublie() {
    const adresse = email.trim()
    if (!EMAIL_VALIDE.test(adresse)) {
      setInvalides({ email: true, motDePasse: false })
      setMessage({ ton: 'erreur', texte: 'Écris d’abord ton adresse e-mail juste au-dessus, je t’envoie le lien.' })
      champEmail.current?.focus()
      return
    }
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(adresse, {
      redirectTo: `${window.location.origin}/mot-de-passe`,
    })
    // Même message dans tous les cas : on ne révèle pas si l'adresse existe
    setInvalides({ email: false, motDePasse: false })
    setMessage({ ton: 'info', texte: 'Pas de panique : un lien pour le changer t’a été envoyé.' })
  }

  return (
    <>
      <CadreConnexion refContenu={feuille}>
        <Entree rang={0}>
          <h2 className="font-titre text-[34px] font-normal italic leading-[1.05] large:text-[42px]">
            Ravie de te revoir
          </h2>
        </Entree>
        <Entree rang={1}>
          <p className="mt-2 mb-[26px] text-[15px] text-texte-doux">
            Connecte-toi pour retrouver tes idées et ton planning.
          </p>
        </Entree>

        <form onSubmit={seConnecter} noValidate className="flex flex-col gap-3.5">
          <Entree rang={2}>
            <Champ
              ref={champEmail}
              label="Adresse e-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalide={invalides.email}
            />
          </Entree>
          <Entree rang={3}>
            <Champ
              ref={champMotDePasse}
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              invalide={invalides.motDePasse}
            />
          </Entree>
          <Entree rang={4} className="flex justify-end text-sm">
            <button
              type="button"
              onClick={motDePasseOublie}
              className="inline-flex min-h-11 items-center font-medium text-bordeaux hover:text-bordeaux-survol"
            >
              Mot de passe oublié ?
            </button>
          </Entree>

          <p role="alert" className={`min-h-5 text-sm ${message?.ton === 'info' ? 'text-bordeaux' : 'text-erreur'}`}>
            <AnimatePresence mode="wait">
              {message && (
                <motion.span
                  key={message.texte}
                  className="block"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {message.texte}
                </motion.span>
              )}
            </AnimatePresence>
          </p>

          <Entree rang={5}>
            <Bouton
              ref={bouton}
              type="submit"
              taille="grand"
              reflet
              pleineLargeur
              chargement={chargement}
              disabled={!!reussite}
              texteChargement="On y va…"
              iconeFin={<Etincelle />}
            >
              {reussite ? 'C’est parti !' : 'C’est parti pour du nouveau contenu'}
            </Bouton>
          </Entree>
        </form>

        <Entree rang={6}>
          <p className="mt-[26px] text-center text-[13px] text-texte-doux">
            Pensé pour toi, <b className="font-titre font-normal italic text-bordeaux">grande sœur</b>.
          </p>
        </Entree>
      </CadreConnexion>

      {reussite && <EcranReussite origine={reussite} />}
    </>
  )
}
