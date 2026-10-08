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
  revalidatePath('/sujets/[id]', 'page')
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

type Resultat = { ok: boolean }

// Valider ou mettre de côté une idée depuis la Bibliothèque (même logique que decider)
export async function trancherIdee(id: string, decision: 'valide' | 'rejete'): Promise<Resultat> {
  if (!id || !['valide', 'rejete'].includes(decision)) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('sujets').update({ statut: decision }).eq('id', id)
  if (!error) await supabase.from('retours_agent').insert({ sujet_id: id, decision })
  revalidatePath('/sujets')
  revalidatePath('/')
  return { ok: !error }
}

// Range une idée (souvent une idée vocale) dans un thème
export async function rangerSujet(id: string, themeId: string): Promise<Resultat> {
  if (!id || !themeId) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase.from('sujets').update({ theme_id: themeId }).eq('id', id)
  revalidatePath('/sujets')
  return { ok: !error }
}

// Nouvelle idée ajoutée directement dans un thème
export async function creerIdee(titre: string, themeId: string | null): Promise<Resultat> {
  const propre = titre.trim().replace(/\s+/g, ' ').slice(0, 300)
  if (!propre) return { ok: false }
  const supabase = await createClient()
  const { error } = await supabase
    .from('sujets')
    .insert({ titre: propre, theme_id: themeId, statut: 'idee', origine: 'manuella' })
  revalidatePath('/sujets')
  revalidatePath('/')
  return { ok: !error }
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
