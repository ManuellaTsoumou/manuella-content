'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { DUREES, COURBES } from '@/lib/animation'
import { ListeDeroulante } from './ui/Champ'
import Bouton, { Etincelle } from './ui/Bouton'
import { useToast } from './ui/Toast'
import { gerbe } from '@/lib/confettis'

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

export default function GenerateurFiche({ sujetId, formatInitial }: { sujetId: string; formatInitial?: string | null }) {
  const router = useRouter()
  const toast = useToast()
  const [format, setFormat] = useState(formatInitial && FORMATS.some(([v]) => v === formatInitial) ? formatInitial : 'talk')
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
      gerbe(null, true)
      toast('Ta fiche est prête. Hook, script et sources t’attendent.')
    } catch {
      toast('L’agent n’a pas réussi à finir la fiche. Réessaie dans un instant.', 'erreur')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="fond-couverture grain relative flex flex-col gap-3.5 overflow-hidden rounded-carte p-5 text-blanc shadow-couverture carte:p-6">
      <div className="relative z-[2] flex items-center gap-2.5">
        <Etincelle />
        <p className="surtitre text-sur-bordeaux">Agent IA</p>
      </div>
      <h2 className="relative z-[2] -mt-1 font-titre text-[clamp(26px,7vw,32px)] font-normal italic">Générer une fiche</h2>
      <p className="relative z-[2] -mt-1.5 text-[15px] text-sur-bordeaux">Hook, script, description et ce qu’il faut savoir avant de tourner.</p>
      <ListeDeroulante className="relative z-[2]" label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
        {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <ListeDeroulante className="relative z-[2]" label="Décor" value={decor} onChange={(e) => setDecor(e.target.value)}>
        {DECORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <ListeDeroulante className="relative z-[2]" label="Façon de parler" value={mode} onChange={(e) => setMode(e.target.value)}>
        {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </ListeDeroulante>
      <Bouton
        variante="clair"
        taille="grand"
        pleineLargeur
        onClick={generer}
        chargement={enCours}
        texteChargement="L’agent recherche et écrit"
        reflet
        iconeFin={<Etincelle className="text-or" />}
        className="relative z-[2] mt-1"
      >
        Générer la fiche
      </Bouton>
      <AnimatePresence>
        {enCours && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUREES.base, ease: COURBES.power3 }}
            className="relative z-[2] text-sm text-sur-bordeaux"
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
