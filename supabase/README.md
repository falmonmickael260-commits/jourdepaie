# Backend multijoueur — état actuel

**Aucune instance Supabase n'est connectée dans cet environnement.** Tout ce qui
suit décrit ce qui est *prêt à être déployé*, pas ce qui tourne déjà.

## Ce qui existe aujourd'hui

- `schema.sql` : tables (`rooms`, `room_players`, `games`, `game_players`,
  `transactions`) + RLS activée avec lecture publique et écriture fermée côté
  client (voir commentaires dans le fichier).
- `src/lib/supabase/client.ts` : client public, désactivé tant que les
  variables d'environnement ne sont pas définies (`isSupabaseConfigured === false`).
- `src/game/engine/*` : moteur de règles et machine à états déjà écrits sous
  une forme pure (reducer `GameState -> GameAction -> GameState`), réutilisable
  tel quel côté serveur (Edge Function / route API) — c'est le même code qui
  tourne aujourd'hui dans la démo locale (`src/game/store/useGameStore.ts`).

## Ce qu'il manque pour un vrai multijoueur réseau

1. **Provisionner un projet Supabase** (ou équivalent Postgres + Realtime) et
   renseigner dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # jamais exposé au client
   ```
2. **Exécuter `schema.sql`** contre ce projet.
3. **Porter `reduceGame` côté serveur** (Edge Function ou route API Next.js)
   pour qu'il soit la seule autorité sur : le résultat des dés, la pioche des
   cartes, les soldes, et les transitions de phase. Le client n'envoie plus
   que des *intentions* (« je lance le dé », « je choisis cette option ») et
   reçoit l'état déjà validé.
4. **Brancher Supabase Realtime** (`supabase.channel(...)`) pour diffuser
   `games` et `game_players` à tous les clients d'une même partie, en
   remplacement de `useGameStore` (zustand local) qui doit devenir un simple
   cache du dernier état reçu du serveur.
5. **Générer le code de salon côté serveur** (actuellement généré dans le
   navigateur par `useLobbyStore`, donc invisible des autres appareils).
6. **Gérer la reconnexion** : à la reconnexion d'un onglet, relire l'état
   complet (`games` + `transactions` depuis le dernier horodatage connu)
   plutôt que de rejouer les actions localement.

## Pourquoi ce n'est pas fait ici

La création d'un projet Supabase est une action externe qui nécessite un
compte et des identifiants appartenant à l'utilisateur ; elle ne peut pas être
réalisée de façon autonome depuis cet environnement. Le code est structuré
pour que cette étape soit un branchement, pas une réécriture.
