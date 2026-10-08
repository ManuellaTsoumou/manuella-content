'use client'

import { useId, useRef, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DUREES, COURBES, RESSORTS } from '@/lib/animation'

// Le champ de la maquette connexion.html : 62 px, label qui remonte et rétrécit, halo bordeaux au focus
const BASE =
  'peer w-full h-[62px] rounded-champ border bg-surface px-[18px] pt-[22px] pb-1.5 text-base text-texte outline-none transition-[border-color,box-shadow] duration-[250ms] focus:border-bordeaux focus:shadow-focus'

const LABEL =
  'pointer-events-none absolute left-[19px] top-[21px] origin-top-left text-base text-texte-doux transition-[transform,color] duration-[250ms] ease-doux'

type ChampProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  label: string
  erreur?: string
  aide?: string
}

export default function Champ({ label, erreur, aide, type = 'text', id, className = '', ...reste }: ChampProps) {
  const idAuto = useId()
  const idChamp = id ?? idAuto
  const idMessage = `${idChamp}-message`
  const champ = useRef<HTMLInputElement>(null)
  const [visible, setVisible] = useState(false)
  const estMotDePasse = type === 'password'

  return (
    <div className={className}>
      <div className="relative">
        <input
          ref={champ}
          id={idChamp}
          type={estMotDePasse && visible ? 'text' : type}
          placeholder=" "
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur || aide ? idMessage : undefined}
          className={`${BASE} ${estMotDePasse ? 'pr-[58px]' : ''} ${erreur ? 'border-erreur' : 'border-ligne'}`}
          {...reste}
        />
        <label
          htmlFor={idChamp}
          className={`${LABEL} peer-focus:-translate-y-3 peer-focus:scale-[0.74] peer-focus:text-bordeaux peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-[0.74] peer-[:not(:placeholder-shown)]:text-bordeaux`}
        >
          {label}
        </label>
        {estMotDePasse && (
          <motion.button
            key={visible ? 'ouvert' : 'ferme'}
            type="button"
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={RESSORTS.rebond}
            onClick={() => {
              setVisible((v) => !v)
              champ.current?.focus()
            }}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="absolute right-2 top-[9px] size-11 rounded-xl grid place-items-center text-texte-doux hover:text-bordeaux transition-colors"
          >
            <Oeil ouvert={!visible} />
          </motion.button>
        )}
      </div>
      <Message id={idMessage} erreur={erreur} aide={aide} />
    </div>
  )
}

type ListeProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  erreur?: string
}

// Liste déroulante assortie (le label reste toujours en haut)
export function ListeDeroulante({ label, erreur, id, className = '', children, ...reste }: ListeProps) {
  const idAuto = useId()
  const idChamp = id ?? idAuto
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={idChamp}
          aria-invalid={erreur ? true : undefined}
          className={`${BASE} appearance-none pr-11 ${erreur ? 'border-erreur' : 'border-ligne'}`}
          {...reste}
        >
          {children}
        </select>
        <label
          htmlFor={idChamp}
          className={`${LABEL} -translate-y-3 scale-[0.74] text-bordeaux`}
        >
          {label}
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-[18px] top-1/2 -translate-y-1/2 size-4 text-texte-doux"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <Message id={`${idChamp}-message`} erreur={erreur} />
    </div>
  )
}

function Message({ id, erreur, aide }: { id: string; erreur?: string; aide?: string }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {erreur ? (
        <motion.p
          key="erreur"
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUREES.base, ease: COURBES.power3 }}
          className="mt-1.5 px-1 text-sm text-erreur"
        >
          {erreur}
        </motion.p>
      ) : aide ? (
        <p key="aide" id={id} className="mt-1.5 px-1 text-sm text-texte-doux">
          {aide}
        </p>
      ) : null}
    </AnimatePresence>
  )
}

// Les deux icônes de la maquette (œil ouvert / œil barré)
function Oeil({ ouvert }: { ouvert: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ouvert ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      )}
    </svg>
  )
}
