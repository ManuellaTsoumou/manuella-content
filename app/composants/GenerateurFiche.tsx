'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DUREES, COURBES } from '@/lib/animation'
import { ListeDeroulante } from './ui/Champ'
import Bouton from './ui/Bouton'
import { useToast } from './ui/Toast'

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
  const toast = useToast()
  const [format, setFormat] = useState('talk')
  const [decor, setDecor] = useState('pendant_makeup')
  const [mode, setMode] = useState('voix_off')
  const [enCours, setEnCours] = useState(false)

  async function generer() {
    setEnCours(true)
    try {
      const reponse = await fetch('/api/fiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujetId, format, decor, mode }),
      })
      if (!reponse.ok) throw new Error()
      router.refresh()
      toast('Ta fiche est prête. Hook, script et sources t’attendent.', 'celebration')
    } catch {
      toast('L’agent n’a pas réussi à finir la fiche. Réessaie dans un instant.', 'erreur')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="rounded-carte bg-bordeaux-700 text-blanc p-5 shadow-elevee flex flex-col gap-3">
      <p className="surtitre text-bordeaux-200">Agent IA</p>
      <h2 className="font-titre text-titre-2 font-semibold -mt-1">Générer une fiche</h2>
      <ListeDeroulante label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
        {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <ListeDeroulante label="Décor" value={decor} onChange={(e) => setDecor(e.target.value)}>
        {DECORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <ListeDeroulante label="Façon de parler" value={mode} onChange={(e) => setMode(e.target.value)}>
        {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <Bouton
        variante="clair"
        taille="grand"
        pleineLargeur
        onClick={generer}
        chargement={enCours}
        texteChargement="L’agent recherche et écrit"
        className="mt-1"
      >
        Générer la fiche
      </Bouton>
      <AnimatePresence>
        {enCours && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUREES.base, ease: COURBES.sortie }}
            className="text-sm text-bordeaux-200"
            role="status"
          >
            Recherche des sources, écriture du hook et du script : compte une à deux minutes. Tu
            peux souffler.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}
