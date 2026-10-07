'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FORMATS = [
  ['talk', 'Talk'],
  ['confession_astuce', 'Confession/astuce'],
  ['one_girl_many_lives', 'One Girl, Many Lives'],
  ['anglais', 'Anglais'],
]
const DECORS = [
  ['pendant_makeup', 'Pendant le makeup'],
  ['routine_skincare', 'Routine skincare'],
  ['routine_clean_girl', 'Routine clean girl'],
  ['face_cam_maquillee', 'Face cam maquillée'],
  ['vlog', 'Vlog'],
  ['autre', 'Autre'],
]
const MODES = [
  ['voix_off', 'Voix off'],
  ['face_cam', 'Face cam'],
  ['sans_parole', 'Sans parole'],
]

export default function GenerateurFiche({ sujetId }: { sujetId: string }) {
  const router = useRouter()
  const [format, setFormat] = useState('talk')
  const [decor, setDecor] = useState('pendant_makeup')
  const [mode, setMode] = useState('voix_off')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  async function generer() {
    setEnCours(true)
    setErreur('')
    try {
      const reponse = await fetch('/api/fiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujetId, format, decor, mode }),
      })
      const donnees = await reponse.json()
      if (!reponse.ok) throw new Error(donnees.erreur ?? 'La génération a échoué.')
      router.refresh()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'La génération a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  const champ = 'h-11 rounded-xl bg-white px-3 text-base text-encre'

  return (
    <section className="rounded-3xl border border-rose p-5 flex flex-col gap-3">
      <h2 className="font-titre text-white text-2xl font-semibold">Générer une fiche</h2>
      <label className="flex flex-col gap-1.5 text-sm text-rose">
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value)} className={champ}>
          {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-rose">
        Décor
        <select value={decor} onChange={(e) => setDecor(e.target.value)} className={champ}>
          {DECORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-rose">
        Façon de parler
        <select value={mode} onChange={(e) => setMode(e.target.value)} className={champ}>
          {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={generer}
        disabled={enCours}
        className="mt-1 h-12 rounded-full bg-white text-bordeaux text-base font-medium disabled:opacity-70"
      >
        {enCours ? 'L’agent recherche et écrit…' : 'Générer la fiche'}
      </button>
      {enCours && (
        <p className="text-sm text-rose">
          Recherche des sources, écriture du hook et du script : compte une à deux minutes.
        </p>
      )}
      {erreur && <p role="alert" className="text-sm text-white">{erreur}</p>}
    </section>
  )
}
