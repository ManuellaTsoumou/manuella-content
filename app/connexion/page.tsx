'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <main className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="font-titre text-white text-5xl font-semibold leading-none">
          Manuella
          <br />
          Content
        </h1>
        <p className="mt-4 text-rose text-base">
          Ton espace pour créer, apprendre et faire grandir ta communauté.
        </p>

        <form
          onSubmit={seConnecter}
          className="mt-10 bg-white rounded-3xl p-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm text-neutral-600">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border border-neutral-300 px-4 text-base text-encre focus:border-bordeaux focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-neutral-600">
            Mot de passe
            <input
              type="password"
              required
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="h-12 rounded-xl border border-neutral-300 px-4 text-base text-encre focus:border-bordeaux focus:outline-none"
            />
          </label>

          {erreur && (
            <p role="alert" className="text-sm text-bordeaux">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="mt-2 h-12 rounded-full bg-bordeaux text-white text-base font-medium disabled:opacity-60"
          >
            {chargement ? 'Connexion…' : 'Me connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
