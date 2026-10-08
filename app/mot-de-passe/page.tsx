'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { gerbe, vibrer } from '@/lib/confettis'
import Bouton, { Etincelle } from '../composants/ui/Bouton'
import Champ from '../composants/ui/Champ'
import { useToast } from '../composants/ui/Toast'
import CadreConnexion, { Entree } from '../connexion/CadreConnexion'

type Etat = 'verification' | 'pret' | 'expire'

// Page ouverte depuis le lien « Mot de passe oublié » reçu par e-mail.
export default function NouveauMotDePasse() {
  const router = useRouter()
  const toast = useToast()
  const reduit = useReducedMotion()
  const [feuille, animer] = useAnimate<HTMLDivElement>()
  const bouton = useRef<HTMLButtonElement>(null)

  const [etat, setEtat] = useState<Etat>('verification')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  // Le lien contient un code à usage unique : Supabase l'échange contre une session temporaire
  useEffect(() => {
    const supabase = createClient()
    const code = new URLSearchParams(window.location.search).get('code')
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) return setEtat('pret')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) return setEtat('pret')
      }
      setEtat('expire')
    })()
  }, [])

  function trembler(texte: string) {
    setErreur(texte)
    vibrer([30, 40, 30])
    if (!reduit && feuille.current) {
      animer(feuille.current, { x: [0, -12, 10, -8, 6, -3, 0] }, { duration: 0.5, ease: 'easeOut' })
    }
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (motDePasse.length < 6) return trembler('Ton mot de passe doit faire au moins 6 caractères.')
    if (motDePasse !== confirmation) return trembler('Les deux mots de passe ne sont pas identiques. On réessaie ?')

    setErreur('')
    setChargement(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    if (error) {
      setChargement(false)
      return trembler('Ce mot de passe n’a pas pu être enregistré. Choisis-en un autre, ou redemande un lien.')
    }

    gerbe(bouton.current)
    vibrer(30)
    toast('Nouveau mot de passe enregistré. Bienvenue chez toi.')
    router.push('/')
    router.refresh()
  }

  return (
    <CadreConnexion refContenu={feuille}>
      <Entree rang={0}>
        <h2 className="font-titre text-[34px] font-normal italic leading-[1.05] large:text-[42px]">
          {etat === 'expire' ? 'Ce lien a fait son temps' : 'Un nouveau départ'}
        </h2>
      </Entree>
      <Entree rang={1}>
        <p className="mt-2 mb-[26px] text-[15px] text-texte-doux">
          {etat === 'expire'
            ? 'Il a expiré ou il a déjà servi. Redemande-en un depuis la page de connexion, c’est l’affaire d’une minute.'
            : 'Choisis ton nouveau mot de passe. Au moins 6 caractères, et garde-le précieusement.'}
        </p>
      </Entree>

      {etat === 'expire' ? (
        <Entree rang={2}>
          <Link
            href="/connexion"
            className="fond-bouton reflet flex min-h-16 w-full items-center justify-center gap-3 rounded-bouton px-[18px] font-medium text-blanc no-underline shadow-bouton"
          >
            <span className="relative">Revenir à la connexion</span>
          </Link>
        </Entree>
      ) : (
        <form onSubmit={enregistrer} noValidate className="flex flex-col gap-3.5">
          <Entree rang={2}>
            <Champ
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              invalide={!!erreur && motDePasse.length < 6}
            />
          </Entree>
          <Entree rang={3}>
            <Champ
              label="Confirme-le"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              invalide={!!erreur && motDePasse.length >= 6}
            />
          </Entree>

          <p role="alert" className="min-h-5 text-sm text-erreur">
            <AnimatePresence mode="wait">
              {erreur && (
                <motion.span
                  key={erreur}
                  className="block"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {erreur}
                </motion.span>
              )}
            </AnimatePresence>
          </p>

          <Entree rang={4}>
            <Bouton
              ref={bouton}
              type="submit"
              taille="grand"
              reflet
              pleineLargeur
              chargement={chargement || etat === 'verification'}
              texteChargement={etat === 'verification' ? 'Je vérifie ton lien…' : 'J’enregistre…'}
              iconeFin={<Etincelle />}
            >
              Enregistrer mon mot de passe
            </Bouton>
          </Entree>
        </form>
      )}

      <Entree rang={5}>
        <p className="mt-[26px] text-center text-[13px] text-texte-doux">
          Pensé pour toi, <b className="font-titre font-normal italic text-bordeaux">grande sœur</b>.
        </p>
      </Entree>
    </CadreConnexion>
  )
}
