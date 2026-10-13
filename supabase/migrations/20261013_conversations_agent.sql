-- =====================================================================
-- Manuella Content : mémoire de l'agent IA (conversations)
--
-- À lancer une seule fois dans Supabase > SQL Editor.
-- Le script peut être relancé sans danger. Tout se fait dans une transaction.
-- =====================================================================

begin;

create table if not exists public.conversations_agent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titre text not null default 'Nouvelle conversation',
  -- L'échange complet, au format de l'API Claude (texte, propositions de sujets…)
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_agent_user_maj_idx
  on public.conversations_agent (user_id, updated_at desc);

-- La date de mise à jour se tient toute seule
create or replace function public.conversations_agent_maj()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists conversations_agent_maj_trg on public.conversations_agent;
create trigger conversations_agent_maj_trg
  before update on public.conversations_agent
  for each row execute function public.conversations_agent_maj();

-- Sécurité : chacune ne voit et ne modifie que ses propres conversations
alter table public.conversations_agent enable row level security;

drop policy if exists proprietaire on public.conversations_agent;
create policy proprietaire
  on public.conversations_agent
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

commit;

-- Vérification : la règle de sécurité doit apparaître
select tablename, policyname, permissive, cmd
from pg_policies
where schemaname = 'public' and tablename = 'conversations_agent';
