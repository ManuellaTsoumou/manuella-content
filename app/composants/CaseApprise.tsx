'use client'

import { useState } from 'react'
import { basculerAppris } from '@/app/sujets/[id]/actions'
import Case from './ui/Case'
import FormulaireAction from './ui/FormulaireAction'

export default function CaseApprise({ id, appris, notion }: { id: string; appris: boolean; notion: string }) {
  // La coche se dessine tout de suite, sans attendre la réponse du serveur,
  // puis se recale sur la valeur enregistrée quand elle revient.
  const [coche, setCoche] = useState(appris)
  const [enregistre, setEnregistre] = useState(appris)
  if (appris !== enregistre) {
    setEnregistre(appris)
    setCoche(appris)
  }

  return (
    <FormulaireAction
      action={basculerAppris}
      messageSucces={appris ? undefined : 'Une notion de plus dans ta tête. Bravo.'}
      className="flex"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="appris" value={appris ? 'non' : 'oui'} />
      <Case
        coche={coche}
        surFondSombre
        onChange={(e) => {
          setCoche(!appris)
          e.currentTarget.form?.requestSubmit()
        }}
        className="text-blanc text-base font-medium"
      >
        {notion}
      </Case>
    </FormulaireAction>
  )
}
