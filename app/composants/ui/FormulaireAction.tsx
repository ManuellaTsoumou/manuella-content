'use client'

import { useRef, type FormHTMLAttributes, type ReactNode } from 'react'
import { gerbe, vibrer } from '@/lib/confettis'
import { useToast } from './Toast'

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, 'action'> & {
  action: (formData: FormData) => Promise<void>
  // Message affiché une fois l'action terminée
  messageSucces?: string
  // Gerbe de confettis dorés depuis le formulaire
  celebration?: boolean
  children: ReactNode
}

// Enveloppe une server action existante sans la modifier :
// même envoi, mêmes données, avec en plus un toast quand c'est fait.
export default function FormulaireAction({ action, messageSucces, celebration = false, children, ...reste }: Props) {
  const toast = useToast()
  const ref = useRef<HTMLFormElement>(null)

  async function envoyer(formData: FormData) {
    try {
      await action(formData)
      if (celebration) {
        gerbe(ref.current)
        vibrer(25)
      }
      if (messageSucces) toast(messageSucces)
    } catch {
      toast('Ça n’a pas marché cette fois. Vérifie ta connexion et réessaie.', 'erreur')
    }
  }

  return (
    <form ref={ref} action={envoyer} {...reste}>
      {children}
    </form>
  )
}
