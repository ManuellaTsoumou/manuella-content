'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Champ from '../composants/ui/Champ'
import Bouton from '../composants/ui/Bouton'

// Version provisoire sur le nouveau design system : la mise en scène complète arrive à l'étape 3
export default function Connexion() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  async function seConnecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreur('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur('Email ou mot de passe incorrect. Vérifie-les et réessaie.')
      setChargement(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="font-titre text-affichage font-medium">
          Manuella
          <br />
          <em className="text-accent">Content</em>
        </h1>
        <p className="mt-4 text-texte-doux text-base">
          Ton espace pour créer, apprendre et faire grandir ta communauté.
        </p>

        <form
          onSubmit={seConnecter}
          className="mt-10 bg-surface rounded-carte p-6 shadow-douce flex flex-col gap-4"
        >
          <Champ
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Champ
            label="Mot de passe"
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            erreur={erreur || undefined}
          />
          <Bouton
            type="submit"
            taille="grand"
            pleineLargeur
            chargement={chargement}
            texteChargement="Connexion"
            className="mt-2"
          >
            Me connecter
          </Bouton>
        </form>
      </div>
    </main>
  )
}
