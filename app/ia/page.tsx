import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { versBulles } from '@/lib/agent/conversation'
import { PHOTO_MANUELLA } from '@/lib/marque'
import TransitionPage from '../composants/animation/TransitionPage'
import { SkeletonPage } from '../composants/ui/Skeleton'
import Agent from '../composants/agent/Agent'

type Recherche = Promise<{ c?: string }>

export default function Page({ searchParams }: { searchParams: Recherche }) {
  return (
    <TransitionPage>
      <Suspense fallback={<SkeletonPage texte="Ton agent arrive…" cartes={2} />}>
        <DonneesAgent searchParams={searchParams} />
      </Suspense>
    </TransitionPage>
  )
}

async function DonneesAgent({ searchParams }: { searchParams: Recherche }) {
  const { c } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [conversations, ouverte, themes, sujets, profil] = await Promise.all([
    supabase.from('conversations_agent').select('id, titre, updated_at').order('updated_at', { ascending: false }).limit(20),
    c ? supabase.from('conversations_agent').select('id, messages').eq('id', c).single() : Promise.resolve({ data: null }),
    supabase.from('themes').select('id, nom').order('ordre'),
    supabase.from('sujets').select('titre').neq('statut', 'rejete'),
    supabase.from('profil').select('photo_url').eq('id', user.id).single(),
  ])

  // Table absente : le fichier SQL de la mémoire n'a pas encore été lancé
  const memoireAbsente = ['42P01', 'PGRST205'].includes(conversations.error?.code ?? '')

  return (
    <Agent
      key={ouverte.data?.id ?? 'nouvelle'}
      conversationId={ouverte.data?.id ?? null}
      bulles={versBulles((ouverte.data?.messages as Anthropic.Beta.BetaMessageParam[] | null) ?? [])}
      conversations={(conversations.data ?? []).map((x) => ({ id: x.id, titre: x.titre }))}
      themes={themes.data ?? []}
      titresExistants={(sujets.data ?? []).map((s) => s.titre)}
      photo={profil.data?.photo_url ?? PHOTO_MANUELLA}
      memoireAbsente={memoireAbsente}
    />
  )
}
