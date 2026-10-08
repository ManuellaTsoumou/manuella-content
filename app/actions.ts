'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { jourParis } from '@/lib/dates'

const PLATEFORMES = ['tiktok', 'instagram', 'youtube', 'snapchat', 'facebook', 'x', 'pinterest', 'autre']

type Resultat = { ok: boolean }

// Met à jour le nombre d'abonnés d'un réseau.
// L'historique s'enregistre tout seul grâce au déclencheur SQL.
export async function majAbonnes(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const abonnes = Number(formData.get('abonnes'))
  if (!id || !Number.isInteger(abonnes) || abonnes < 0) return

  const supabase = await createClient()
  await supabase.from('reseaux').update({ abonnes }).eq('id', id)
  revalidatePath('/')
  revalidatePath('/profil')
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
  revalidatePath('/profil')
}

export async function seDeconnecter() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/connexion')
}

// « Je le prends » : le sujet rejoint le planning d'aujourd'hui
export async function prendreSujet(sujetId: string): Promise<Resultat> {
  if (!sujetId) return { ok: false }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from('calendrier')
    .insert({ user_id: user.id, sujet_id: sujetId, date_prevue: jourParis() })
  revalidatePath('/')
  return { ok: !error }
}

// Interrupteur « Jour off » : ajoute ou retire aujourd'hui de tes jours de repos
export async function basculerJourOff(actif: boolean): Promise<Resultat> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const jour = jourParis()
  let error
  if (actif) {
    const { data: existant } = await supabase.from('jours_off').select('id').eq('jour', jour).limit(1)
    if (!existant?.length) ({ error } = await supabase.from('jours_off').insert({ user_id: user.id, jour }))
  } else {
    ;({ error } = await supabase.from('jours_off').delete().eq('jour', jour))
  }
  revalidatePath('/')
  return { ok: !error }
}

// Idée vocale (ou écrite) : elle arrive dans la banque comme nouveau sujet « idée »
export async function enregistrerIdee(texte: string): Promise<Resultat> {
  const titre = texte.trim().replace(/\s+/g, ' ').slice(0, 300)
  if (!titre) return { ok: false }

  const supabase = await createClient()
  const { error } = await supabase.from('sujets').insert({ titre, statut: 'idee', origine: 'manuella' })
  revalidatePath('/')
  revalidatePath('/sujets')
  return { ok: !error }
}
