-- =====================================================================
-- Manuella Content : piliers des thèmes, planning par sujet,
-- format des sujets et date de publication.
--
-- À lancer une seule fois dans Supabase > SQL Editor.
-- Le script peut être relancé sans danger (il vérifie ce qui existe déjà).
-- Tout se fait dans une transaction : si une ligne échoue, rien n'est appliqué.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Pilier de chaque thème : soin, mental ou evoluer
-- ---------------------------------------------------------------------

alter table public.themes
  add column if not exists pilier text;

alter table public.themes
  drop constraint if exists themes_pilier_check;
alter table public.themes
  add constraint themes_pilier_check
  check (pilier is null or pilier in ('soin', 'mental', 'evoluer'));

-- Les 11 thèmes, reconnus par leur nom (avec ou sans accents, sans tenir compte des majuscules)
update public.themes set pilier = case
  when nom ilike '%confiance%'                         then 'mental'
  when nom ilike '%jeunesse%'                          then 'mental'
  when nom ilike '%respect%'                           then 'mental'
  when nom ilike '%cerveau%'                           then 'mental'
  when nom ilike '%beaut%'                             then 'soin'
  when nom ilike '%hygi%ne%'                           then 'soin'
  when nom ilike '%l_gance%'                           then 'soin'
  when nom ilike '%anglais%'                           then 'evoluer'
  when nom ilike '%femme%'                             then 'evoluer'
  when nom ilike '%objectif%'                          then 'evoluer'
  when nom ilike '%communaut%'                         then 'evoluer'
  else pilier
end;

-- ---------------------------------------------------------------------
-- 2. Format d'un sujet (mêmes valeurs que les fiches)
-- ---------------------------------------------------------------------

alter table public.sujets
  add column if not exists format text;

alter table public.sujets
  drop constraint if exists sujets_format_check;
alter table public.sujets
  add constraint sujets_format_check
  check (format is null or format in ('one_girl_many_lives', 'talk', 'confession_astuce', 'anglais'));

-- Les sujets qui ont déjà une fiche reprennent le format de leur fiche la plus récente
update public.sujets s
set format = f.format
from (
  select distinct on (sujet_id) sujet_id, format
  from public.fiches
  where format is not null
  order by sujet_id, created_at desc
) f
where f.sujet_id = s.id
  and s.format is null
  and f.format in ('one_girl_many_lives', 'talk', 'confession_astuce', 'anglais');

-- ---------------------------------------------------------------------
-- 3. Planning : un contenu prévu peut pointer vers un sujet OU une fiche
-- ---------------------------------------------------------------------

alter table public.calendrier
  add column if not exists sujet_id uuid references public.sujets (id) on delete cascade;

-- fiche_id reste possible, mais n'est plus obligatoire
alter table public.calendrier
  alter column fiche_id drop not null;

-- Les entrées existantes récupèrent le sujet de leur fiche
update public.calendrier c
set sujet_id = f.sujet_id
from public.fiches f
where c.fiche_id = f.id
  and c.sujet_id is null;

-- Chaque entrée du planning doit pointer vers quelque chose
alter table public.calendrier
  drop constraint if exists calendrier_sujet_ou_fiche_check;
alter table public.calendrier
  add constraint calendrier_sujet_ou_fiche_check
  check (sujet_id is not null or fiche_id is not null);

create index if not exists calendrier_sujet_id_idx on public.calendrier (sujet_id);
create index if not exists calendrier_date_prevue_idx on public.calendrier (date_prevue);

-- ---------------------------------------------------------------------
-- 4. Date de publication, remplie automatiquement
-- ---------------------------------------------------------------------

alter table public.sujets
  add column if not exists date_publication timestamptz;

create or replace function public.sujets_date_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.statut = 'publie' then
    -- Passage à « publié » : on note le moment (sauf si une date est déjà fournie)
    if tg_op = 'INSERT' or old.statut is distinct from 'publie' then
      new.date_publication := coalesce(new.date_publication, now());
    end if;
  else
    -- Le sujet n'est plus publié : la date n'a plus de sens (la série reste honnête)
    new.date_publication := null;
  end if;
  return new;
end;
$$;

drop trigger if exists sujets_date_publication_trg on public.sujets;
create trigger sujets_date_publication_trg
  before insert or update of statut on public.sujets
  for each row execute function public.sujets_date_publication();

create index if not exists sujets_date_publication_idx on public.sujets (date_publication);

-- Sujets déjà publiés avant ce script : leur dernière modification sert de date approximative
update public.sujets
set date_publication = updated_at
where statut = 'publie'
  and date_publication is null;

-- ---------------------------------------------------------------------
-- 5. Sécurité (RLS)
--
-- Les règles RLS protègent des LIGNES, pas des colonnes : tes règles actuelles
-- sur themes, sujets et calendrier couvrent donc automatiquement les nouvelles colonnes.
-- On s'assure seulement que RLS est bien actif, et on ajoute une règle
-- supplémentaire (restrictive : elle s'ajoute à tes règles, elle n'en retire aucune)
-- pour qu'une entrée du planning ne puisse pointer que vers TES sujets et TES fiches.
-- ---------------------------------------------------------------------

alter table public.themes enable row level security;
alter table public.sujets enable row level security;
alter table public.calendrier enable row level security;

drop policy if exists calendrier_cibles_a_moi_insert on public.calendrier;
create policy calendrier_cibles_a_moi_insert
  on public.calendrier
  as restrictive
  for insert
  to authenticated
  with check (
    (sujet_id is null or exists (
      select 1 from public.sujets s where s.id = sujet_id and s.user_id = (select auth.uid())
    ))
    and (fiche_id is null or exists (
      select 1 from public.fiches f where f.id = fiche_id and f.user_id = (select auth.uid())
    ))
  );

drop policy if exists calendrier_cibles_a_moi_update on public.calendrier;
create policy calendrier_cibles_a_moi_update
  on public.calendrier
  as restrictive
  for update
  to authenticated
  with check (
    (sujet_id is null or exists (
      select 1 from public.sujets s where s.id = sujet_id and s.user_id = (select auth.uid())
    ))
    and (fiche_id is null or exists (
      select 1 from public.fiches f where f.id = fiche_id and f.user_id = (select auth.uid())
    ))
  );

commit;

-- =====================================================================
-- Vérifications (résultats affichés à la fin dans le SQL Editor)
-- =====================================================================

-- a) Chaque thème doit avoir un pilier. Si une ligne affiche « null »,
--    dis-moi son nom : il n'a pas été reconnu.
select ordre, nom, pilier
from public.themes
order by ordre;

-- b) Les règles RLS en place sur les tables concernées
select tablename, policyname, permissive, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('themes', 'sujets', 'calendrier')
order by tablename, policyname;
