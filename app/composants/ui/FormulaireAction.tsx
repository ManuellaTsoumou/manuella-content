'use client'

import type { FormHTMLAttributes, ReactNode } from 'react'
import { useToast } from './Toast'

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, 'action'> & {
  action: (formData: FormData) => Promise<void>
  // Message affiché une fois l'action terminée
  messageSucces?: string
  celebration?: boolean
  children: ReactNode
}

// Enveloppe une server action existante sans la modifier :
// même envoi, même données, avec en plus un toast quand c'est fait.
export default function FormulaireAction({ action, messageSucces, celebration = false, children, ...reste }: Props) {
  const toast = useToast()

  async function envoyer(formData: FormData) {
    try {
      await action(formData)
      if (messageSucces) toast(messageSucces, celebration ? 'celebration' : 'succes')
    } catch {
      toast('Ça n’a pas marché cette fois. Vérifie ta connexion et réessaie.', 'erreur')
    }
  }

  return (
    <form action={envoyer} {...reste}>
      {children}
    </form>
  )
}
