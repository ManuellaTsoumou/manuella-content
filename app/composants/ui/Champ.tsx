'use client'

import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DUREES, COURBES } from '@/lib/animation'

const BASE =
  'peer w-full rounded-champ border bg-surface text-base text-texte outline-none transition-[border-color,box-shadow] duration-200 focus:border-accent focus:shadow-focus'

type ChampProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  label: string
  erreur?: string
  aide?: string
}

// Champ avec label flottant : le label se pose dans le champ, puis remonte au focus ou dès qu'il y a du texte
export default function Champ({ label, erreur, aide, type = 'text', id, className = '', ...reste }: ChampProps) {
  const idAuto = useId()
  const idChamp = id ?? idAuto
  const idMessage = `${idChamp}-message`
  const [visible, setVisible] = useState(false)
  const estMotDePasse = type === 'password'

  return (
    <div className={className}>
      <div className="relative">
        <input
          id={idChamp}
          type={estMotDePasse && visible ? 'text' : type}
          placeholder=" "
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur || aide ? idMessage : undefined}
          className={`${BASE} h-14 px-4 pt-5 pb-1.5 ${estMotDePasse ? 'pr-14' : ''} ${
            erreur ? 'border-erreur' : 'border-bord'
          }`}
          {...reste}
        />
        <label
          htmlFor={idChamp}
          className="pointer-events-none absolute left-4 top-2 origin-left text-xs text-texte-doux transition-all duration-200 ease-sortie peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-accent"
        >
          {label}
        </label>
        {estMotDePasse && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-11 rounded-full flex items-center justify-center text-texte-doux hover:text-accent transition-colors"
          >
            <Oeil ouvert={visible} />
          </button>
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

// Liste déroulante assortie aux champs (le label reste toujours en haut)
export function ListeDeroulante({ label, erreur, id, className = '', children, ...reste }: ListeProps) {
  const idAuto = useId()
  const idChamp = id ?? idAuto
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={idChamp}
          aria-invalid={erreur ? true : undefined}
          className={`${BASE} h-14 appearance-none px-4 pt-5 pb-1.5 pr-10 ${erreur ? 'border-erreur' : 'border-bord'}`}
          {...reste}
        >
          {children}
        </select>
        <label
          htmlFor={idChamp}
          className="pointer-events-none absolute left-4 top-2 text-xs text-texte-doux peer-focus:text-accent transition-colors"
        >
          {label}
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-texte-doux"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
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
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUREES.rapide, ease: COURBES.sortie }}
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

function Oeil({ ouvert }: { ouvert: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <motion.path
        d="M4 4l16 16"
        initial={false}
        animate={{ pathLength: ouvert ? 0 : 1, opacity: ouvert ? 0 : 1 }}
        transition={{ duration: DUREES.rapide }}
      />
    </svg>
  )
}
