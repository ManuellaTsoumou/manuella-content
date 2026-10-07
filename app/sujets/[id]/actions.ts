'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function basculerAppris(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const appris = formData.get('appris') === 'oui'
  if (!id) return

  const supabase = await createClient()
  await supabase.from('apprentissages').update({ appris }).eq('id', id)
  revalidatePath('/sujets/[id]', 'page')
}
