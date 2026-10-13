'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Resultat = { ok: boolean }

const JOUR_VALIDE = /^\d{4}-\d{2}-\d{2}$/
const HEURE_VALIDE = /^\d{2}:\d{2}$/

function rafraichir() {
  revalidatePath('/planning')
  revalidatePath('/')
}

// Glisser-déposer : le contenu change de jour
export async function deplacerContenu(id: string, jour: string): Promise<Resultat> {
  if (!id || !JOUR_VALIDE.test(jour)) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('calendrier').update({ date_prevue: jour }).eq('id', id)
  rafraichir()
  return { ok: !error }
}

export async function changerHeure(id: string, heure: string | null): Promise<Resultat> {
  if (!id || (heure !== null && !HEURE_VALIDE.test(heure))) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('calendrier').update({ heure }).eq('id', id)
  rafraichir()
  return { ok: !error }
}

export async function retirerContenu(id: string): Promise<Resultat> {
  if (!id) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('calendrier').delete().eq('id', id)
  rafraichir()
  return { ok: !error }
}

// « C'est publié ! » : le sujet passe en publié (la date de publication se remplit toute seule)
export async function marquerPublie(sujetId: string): Promise<Resultat> {
  if (!sujetId) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('sujets').update({ statut: 'publie' }).eq('id', sujetId)
  rafraichir()
  revalidatePath('/sujets')
  return { ok: !error }
}

export async function planifierLe(sujetId: string, jour: string): Promise<Resultat> {
  if (!sujetId || !JOUR_VALIDE.test(jour)) return { ok: false }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }
  const { error } = await supabase.from('calendrier').insert({ user_id: user.id, sujet_id: sujetId, date_prevue: jour })
  rafraichir()
  revalidatePath('/sujets')
  return { ok: !error }
}

export async function basculerJourOffLe(jour: string, actif: boolean): Promise<Resultat> {
  if (!JOUR_VALIDE.test(jour)) return { ok: false }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  let error
  if (actif) {
    const { data: existant } = await supabase.from('jours_off').select('id').eq('jour', jour).limit(1)
    if (!existant?.length) ({ error } = await supabase.from('jours_off').insert({ user_id: user.id, jour }))
  } else {
    ;({ error } = await supabase.from('jours_off').delete().eq('jour', jour))
  }
  rafraichir()
  return { ok: !error }
}
