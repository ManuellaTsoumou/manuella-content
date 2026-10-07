'use client'

import { changerStatut } from '@/app/sujets/actions'

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
    <form action={changerStatut}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`statut-${id}`}>
        Statut du sujet
      </label>
      <select
        id={`statut-${id}`}
        name="statut"
        defaultValue={statut}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-xs text-encre"
      >
        {STATUTS.map(([valeur, label]) => (
          <option key={valeur} value={valeur}>
            {label}
          </option>
        ))}
      </select>
    </form>
  )
}
