'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const STATUTS = ['idee', 'valide', 'a_apprendre', 'tourne', 'publie', 'rejete']

export async function changerStatut(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const statut = String(formData.get('statut') ?? '')
  if (!id || !STATUTS.includes(statut)) return

  const supabase = await createClient()
  await supabase.from('sujets').update({ statut }).eq('id', id)
  revalidatePath('/sujets')
}

// Valider ou rejeter une idée : ton choix est aussi noté pour que l'agent apprenne tes goûts
export async function decider(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const decision = String(formData.get('decision') ?? '')
  if (!id || !['valide', 'rejete'].includes(decision)) return

  const supabase = await createClient()
  await supabase.from('sujets').update({ statut: decision }).eq('id', id)
  await supabase.from('retours_agent').insert({ sujet_id: id, decision })
  revalidatePath('/sujets')
}

export async function ajouterSujet(formData: FormData) {
  const titre = String(formData.get('titre') ?? '').trim()
  const themeId = String(formData.get('theme_id') ?? '')
  if (!titre) return

  const supabase = await createClient()
  await supabase.from('sujets').insert({
    titre,
    theme_id: themeId || null,
    statut: 'idee',
    origine: 'manuella',
  })
  revalidatePath('/sujets')
}
