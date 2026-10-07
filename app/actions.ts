'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PLATEFORMES = ['tiktok', 'instagram', 'youtube', 'snapchat', 'facebook', 'x', 'pinterest', 'autre']

// Met à jour le nombre d'abonnés d'un réseau.
// L'historique s'enregistre tout seul grâce au déclencheur SQL.
export async function majAbonnes(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const abonnes = Number(formData.get('abonnes'))
  if (!id || !Number.isInteger(abonnes) || abonnes < 0) return

  const supabase = await createClient()
  await supabase.from('reseaux').update({ abonnes }).eq('id', id)
  revalidatePath('/')
}

// Ajoute un nouveau réseau, avec l'objectif de 10 000 abonnés par défaut
export async function ajouterReseau(formData: FormData) {
  const plateforme = String(formData.get('plateforme') ?? '')
  const pseudo = String(formData.get('pseudo') ?? '').trim()
  const abonnes = Number(formData.get('abonnes') || 0)
  if (!PLATEFORMES.includes(plateforme) || !pseudo) return
  if (!Number.isInteger(abonnes) || abonnes < 0) return

  const supabase = await createClient()
  await supabase.from('reseaux').insert({ plateforme, pseudo, abonnes })
  revalidatePath('/')
}
