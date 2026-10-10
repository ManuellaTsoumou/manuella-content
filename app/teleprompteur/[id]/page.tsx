import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Teleprompteur from '@/app/composants/teleprompteur/Teleprompteur'

type Params = Promise<{ id: string }>

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-nuit" role="status" aria-label="Préparation du téléprompteur" />}>
      <Lecture params={params} />
    </Suspense>
  )
}

async function Lecture({ params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: fiche } = await supabase
    .from('fiches')
    .select('id, hook, script, sujet_id, sujet:sujet_id(titre)')
    .eq('id', id)
    .single()
  if (!fiche?.script) notFound()

  const sujet = fiche.sujet as unknown as { titre: string } | null

  return (
    <Teleprompteur
      fiche={{
        id: fiche.id,
        sujetId: fiche.sujet_id,
        titre: sujet?.titre ?? 'Ton script',
        hook: fiche.hook,
        script: fiche.script,
      }}
    />
  )
}
