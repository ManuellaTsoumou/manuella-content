// Le petit ruban léopard sous les titres : seul usage du motif dans le texte, purement décoratif.
// « centre » : version de la connexion (ligne, losange, ruban, losange, ligne).
// Sinon : version de la Bibliothèque (ruban, losange, ligne), alignée à gauche.

const LOSANGE = 'size-[7px] rotate-45 bg-or'
const RUBAN =
  'h-[7px] rounded-full bg-leopard bg-(image:--leo-texte) bg-size-[70px_70px] shadow-ruban'

export default function RubanLeopard({
  centre = false,
  surCouverture = true,
  className = '',
}: {
  centre?: boolean
  surCouverture?: boolean
  className?: string
}) {
  const ligne = surCouverture ? 'bg-creme/35' : 'bg-ligne'

  if (centre) {
    return (
      <div aria-hidden="true" className={`flex items-center justify-center gap-3 ${className}`}>
        <span className={`h-px w-10 ${ligne}`} />
        <span className={LOSANGE} />
        <span className={`${RUBAN} w-[76px]`} />
        <span className={LOSANGE} />
        <span className={`h-px w-10 ${ligne}`} />
      </div>
    )
  }

  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className={`${RUBAN} w-[84px]`} />
      <span className={LOSANGE} />
      <span className={`h-px flex-[0_0_46px] ${ligne}`} />
    </div>
  )
}
