'use client'

import { changerStatut } from '@/app/sujets/actions'
import FormulaireAction from './ui/FormulaireAction'

const STATUTS = [
  ['idee', 'Idée'],
  ['valide', 'Validé'],
  ['a_apprendre', 'À apprendre'],
  ['tourne', 'Tourné'],
  ['publie', 'Publié'],
  ['rejete', 'Rejeté'],
] as const

// Change le statut dès que tu choisis une option, sans bouton à cliquer
export default function StatutSujet({ id, statut }: { id: string; statut: string }) {
  return (
    <FormulaireAction action={changerStatut} messageSucces="Statut mis à jour.">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`statut-${id}`}>
        Statut du sujet
      </label>
      <select
        id={`statut-${id}`}
        name="statut"
        defaultValue={statut}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-full border border-bord bg-surface-creuse px-3 text-xs font-medium text-texte outline-none transition-[border-color,box-shadow] duration-200 hover:border-accent focus:border-accent focus:shadow-focus"
      >
        {STATUTS.map(([valeur, label]) => (
          <option key={valeur} value={valeur}>
            {label}
          </option>
        ))}
      </select>
    </FormulaireAction>
  )
}
