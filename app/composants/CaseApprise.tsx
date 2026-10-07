'use client'

import { basculerAppris } from '@/app/sujets/[id]/actions'

export default function CaseApprise({ id, appris, notion }: { id: string; appris: boolean; notion: string }) {
  return (
    <form action={basculerAppris} className="flex">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="appris" value={appris ? 'non' : 'oui'} />
      <label className="flex gap-3 items-start text-white text-base font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={appris}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 w-5 h-5 shrink-0 accent-rose"
        />
        {notion}
      </label>
    </form>
  )
}
