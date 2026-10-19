-- En jour de paie — schéma Supabase (PRÉPARÉ, NON DÉPLOYÉ)
--
-- Ce fichier décrit la structure nécessaire au vrai multijoueur réseau.
-- Il n'a jamais été exécuté contre un projet Supabase dans cet environnement
-- (aucune instance n'a été provisionnée ici). Avant de l'appliquer :
--   1. Créer un projet sur https://supabase.com
--   2. Copier son URL et sa clé anonyme dans .env.local
--      (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
--   3. Exécuter ce fichier via l'éditeur SQL Supabase ou `supabase db push`.
--
-- Principe de sécurité : le client ne doit jamais pouvoir écrire directement
-- un solde, un résultat de dé ou une carte piochée. Toute mutation de jeu
-- passe par une fonction Postgres (`security definer`) ou une Edge Function
-- qui revalide la phase, le joueur actif et l'idempotence de la transaction.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  code text primary key,
  host_id uuid not null,
  max_players int not null check (max_players between 2 and 6),
  started boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  display_name text not null,
  is_host boolean not null default false,
  connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_code, display_name)
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  ruleset_version text not null,
  phase text not null,
  month int not null default 1,
  day int not null default 1,
  active_player_index int not null default 0,
  board jsonb not null,
  last_roll int[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  room_player_id uuid not null references room_players(id) on delete cascade,
  token_id text not null,
  position int not null default 0,
  cash numeric not null default 0,
  savings numeric not null default 0,
  debt numeric not null default 0,
  investments numeric not null default 0
);

-- Table d'idempotence : toute mutation financière porte un identifiant unique.
-- Une Edge Function DOIT vérifier son absence avant d'appliquer l'effet.
create table if not exists transactions (
  id text primary key,
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references game_players(id) on delete cascade,
  amount numeric not null,
  reason text not null,
  balance_before jsonb not null,
  balance_after jsonb not null,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table room_players enable row level security;
alter table games enable row level security;
alter table game_players enable row level security;
alter table transactions enable row level security;

-- Politiques de base (À AFFINER avant mise en production) :
-- lecture ouverte aux joueurs d'un salon/partie, écriture réservée au service role
-- (les mutations de jeu passent exclusivement par des Edge Functions de confiance).
create policy "lecture salon public" on rooms for select using (true);
create policy "lecture joueurs du salon" on room_players for select using (true);
create policy "lecture partie" on games for select using (true);
create policy "lecture joueurs de partie" on game_players for select using (true);
create policy "lecture transactions" on transactions for select using (true);

-- Aucune politique INSERT/UPDATE/DELETE n'est ouverte au rôle anonyme :
-- toute écriture doit transiter par une fonction serveur utilisant la
-- clé de service (SUPABASE_SERVICE_ROLE_KEY), jamais exposée au navigateur.
