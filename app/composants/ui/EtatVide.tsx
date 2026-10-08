import type { ReactNode } from 'react'

// État vide des maquettes (.empty) : une phrase de grande sœur, jamais « Aucune donnée ».
export default function EtatVide({ titre, texte, children }: { titre: string; texte?: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-[50px] text-center">
      <h3 className="font-titre text-[28px] font-medium italic">{titre}</h3>
      {texte && <p className="mt-2 text-texte-doux">{texte}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  )
}
