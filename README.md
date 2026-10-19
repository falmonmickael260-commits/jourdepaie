# En jour de paie

Jeu de société de gestion financière, multijoueur, en ligne — inspiré des
mécaniques de l'édition française récente en euros d'un jeu classique du genre,
avec une identité graphique et des textes entièrement originaux (voir
[`src/game/rules/edition-2024.ts`](src/game/rules/edition-2024.ts) pour le
détail de ce qui est confirmé, en attente, ou configurable).

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Au lancement : menu → créer/rejoindre un salon
→ plateau. **Tant que Supabase n'est pas connecté (voir
[`supabase/README.md`](supabase/README.md)), le salon et la partie sont une
démonstration locale au seul navigateur (hotseat), pas un vrai multijoueur réseau.**

## Scripts

```bash
npm run dev      # serveur de développement
npm run build    # build de production
npm run lint     # ESLint
npm test         # tests unitaires (Vitest) du moteur de jeu et des règles
```

## Structure

- `src/app` — pages (App Router Next.js).
- `src/components` — UI (menu, plateau, HUD, composants partagés).
- `src/game/rules` — règles versionnées et tracées (`confirmed` / `pending` /
  `configurable` / `unimplemented`).
- `src/game/engine` — machine à états pure + transactions idempotentes.
- `src/game/store` — stores Zustand (démonstration locale actuelle).
- `supabase/` — schéma et plan de connexion du backend réseau réel (non déployé).

## État du projet

Voir [`BILAN.md`](BILAN.md) pour le bilan détaillé : fonctionnalités
terminées, règles confirmées vs en attente, tests, sécurité, déploiement.
