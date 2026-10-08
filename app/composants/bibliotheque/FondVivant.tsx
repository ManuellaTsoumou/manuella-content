import Poussiere from '../ui/Poussiere'

// Le fond de la Bibliothèque : trois grandes taches floues qui dérivent lentement, et la poussière dorée.
export default function FondVivant() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span className="absolute -left-[25vmax] -top-[30vmax] size-[70vmax] rounded-full bg-tache-1 blur-[60px] will-change-transform animate-[derive-1_22s_ease-in-out_infinite_alternate]" />
        <span className="absolute -right-[25vmax] top-[20vh] size-[55vmax] rounded-full bg-tache-2 blur-[60px] will-change-transform animate-[derive-2_26s_ease-in-out_infinite_alternate]" />
        <span className="absolute -bottom-[30vmax] -left-[10vmax] size-[50vmax] rounded-full bg-tache-3 blur-[60px] will-change-transform animate-[derive-1_30s_ease-in-out_infinite_alternate-reverse]" />
      </div>
      <Poussiere nombre={28} teinte="or-profond" className="fixed inset-0" />
    </>
  )
}
