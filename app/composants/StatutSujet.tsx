'use client'

import { changerStatut } from '@/app/sujets/actions'
import FormulaireAction from './ui/FormulaireAction'

const STATUTS = [
  ['idee', 'Idée'],
  ['valide', 'Validé'],
  ['a_apprendre', 'À apprendre'],
  ['tourne', 'Tourné'],
  ['publie', 'Publié'],
  ['rejete', 'Mis de côté'],
] as const

// Change le statut dès que tu choisis une option, sans bouton à cliquer.
// Sur les couleurs d'un pilier, la pastille reprend les teintes de la page (--chip, --line-c).
export default function StatutSujet({ id, statut, surPilier = false }: { id: string; statut: string; surPilier?: boolean }) {
  return (
    <FormulaireAction
      action={changerStatut}
      messageSucces="Statut mis à jour."
      celebration={false}
      className="relative inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`statut-${id}`}>
        Statut du sujet
      </label>
      <select
        id={`statut-${id}`}
        name="statut"
        defaultValue={statut}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`min-h-11 appearance-none rounded-full border py-0 pr-9 pl-4 text-sm font-semibold outline-none transition-[border-color,box-shadow] duration-200 ${
          surPilier
            ? 'border-(--line-c) bg-(--chip) text-current focus:shadow-focus-or [&>option]:text-encre'
            : 'border-ligne bg-poudre text-bordeaux hover:border-bordeaux focus:border-bordeaux focus:shadow-focus'
        }`}
      >
        {STATUTS.map(([valeur, label]) => (
          <option key={valeur} value={valeur}>
            {label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </FormulaireAction>
  )
}
