# Bilan — En jour de paie

Projet créé de zéro dans cette session (aucun dépôt existant ne correspondait
au nom). Stack : Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4
+ Framer Motion + Zustand + lucide-react. Dépôt git initialisé localement,
**rien n'a été poussé ni commité au-delà de l'initialisation automatique** —
à vous de valider et commiter.

## 1. Fonctionnalités terminées

- **Loader cinématique** (`src/components/loader/IntroLoader.tsx`) : particules,
  tracé lumineux animé, pièces qui suivent le tracé, révélation du logo, barre
  de progression réelle, respect de `prefers-reduced-motion`, ne se rejoue pas
  à la navigation interne (clé `sessionStorage`), version allégée mobile.
- **Menu principal** (`MainMenu.tsx` + `SceneBackground.tsx`) : scène
  vectorielle originale (skyline, calendrier, pièces flottantes), 4 actions
  toutes fonctionnelles (Jouer en ligne / Créer un salon / Rejoindre un salon /
  Règles), réglages audio/accessibilité.
- **Salon multijoueur** (création, code à 6 caractères, salle d'attente,
  copie du code, départ/lancement) — **fonctionnel mais local au navigateur**
  (voir section 2).
- **Plateau de jeu original** (`GameBoard.tsx`) : parcours en boucle à coins
  arrondis (pas une grille générique), médaillon central, infobulles par case,
  28 cases dont 4 structurantes, entièrement en SVG/CSS (aucun asset externe).
- **Animations de jeu réelles et fonctionnelles** (prioritaires selon vos
  retours en cours de session) :
  - dé 3D avec vrai tumbling puis arrêt sur la face tirée (résultat déterminé
    par le moteur, jamais par l'animation) ;
  - pion qui suit les cases une à une (jamais de saut en ligne droite) ;
  - carte qui se retourne et présente un choix réel ;
  - solde qui s'anime (flash vert/rouge) à chaque gain/perte.
- **HUD complet** : barre supérieure (mois/jour/joueur actif/connexion),
  panneau financier (disponible / épargne / dettes / investissements, tous
  distincts), panneau des autres joueurs, panneau d'action contextuel qui
  n'affiche que les boutons réellement activables selon la phase.
- **Moteur de jeu séparé de l'UI** (`src/game/engine`) : machine à états
  explicite, transactions idempotentes (rejouer le même id ne débite/crédite
  jamais deux fois — testé), contrôle de phase (toute action hors phase
  autorisée est ignorée et journalisée).
- **Module de règles traçable** (`src/game/rules/edition-2024.ts`) : chaque
  valeur porte un statut (`confirmed` / `pending` / `configurable` /
  `unimplemented`) et une référence. Le mode "officiel" reste verrouillé tant
  que les règles critiques ne sont pas confirmées — visible et expliqué sur
  `/regles`.
- **Audio synthétisé** (`src/lib/audio/sfx-engine.ts`) : clic, dé, carte,
  paiement, gain, fin de mois, victoire — générés par Web Audio API, aucun
  fichier externe requis, réglages indépendants musique/SFX.
- **Responsive réel** : testé en 375px (mobile) et desktop ; en-tête
  recomposé (pas juste réduit) pour rester lisible, plateau et panneaux
  réorganisés en colonne sur mobile.
- **Tests unitaires** (Vitest, 10 tests, tous passants) : idempotence des
  transactions, contrôle de phase, boucle de plateau, non-déblocage du mode
  officiel tant que les règles sont `pending`.
- **Qualité** : `npm run lint` et `npx tsc --noEmit` passent sans erreur,
  `npm run build` (production) réussit.

## 2. Fonctionnalités restant à configurer

- **Multijoueur réseau réel.** Tout ce qui existe aujourd'hui (salon, code
  d'invitation, parties) tourne **dans le navigateur courant uniquement**
  (Zustand en mémoire). Ce n'est jamais présenté comme un vrai multijoueur
  dans l'interface — des bandeaux et libellés le rappellent explicitement.
  Pour l'activer : voir `supabase/README.md` (schéma SQL déjà écrit, non
  déployé — nécessite un projet Supabase créé par vous, avec vos identifiants).
- **Profil joueur / historique des parties** : nécessitent une base de
  données persistante, non branchée.
- **Illustrations "peintes"** : sans outil de génération d'image ni connecteur
  Figma disponible dans cet environnement, l'identité visuelle (skyline,
  calendrier, icônes de case) est en composition vectorielle/SVG originale,
  pas en illustration peinte façon boîte de jeu physique. La direction
  artistique (palette, typographies, matières) est en place ; un second passage
  avec des illustrations commandées à un artiste ou générées via un outil
  dédié élèverait encore le rendu.
- **Paquets de cartes complets** : seules 3 cartes d'exemple existent, pour
  valider le moteur (choix, gain, paiement). Les paquets réels par catégorie
  restent à constituer après vérification de la notice.
- **Fin de mois (intérêts, remboursements) et classement final** : la
  structure existe (`ADVANCE_MONTH`, taux dans `economyRules`) mais le calcul
  détaillé des intérêts et le classement de fin de partie ne sont pas encore
  implémentés, faute de règle vérifiée à coder précisément.

## 3. Règles confirmées vs en attente de notice

**Mise à jour :** une notice officielle Hasbro de « La Bonne Paye » a été
retrouvée (PDF téléchargé depuis `instructions.hasbro.com/fr-fr/instruction/payday`,
réf. fabricant `000324470_INST_PaydayRC2_FAR`, © 2014, réimpression 2022) et lue
intégralement. Elle n'est pas explicitement datée « édition 2024 » (boîte
réf. F6424 non retrouvée séparément), mais Hasbro réimprime généralement le
même règlement d'une édition à l'autre.

**Confirmées** (toutes `confirmed` dans `economyRules`, citations exactes dans
`edition-2024.ts`) : capital de départ (1500€), salaire au Jour de Paye
(1500€), taux d'intérêt dette (10 %), taux d'intérêt épargne (25 %, déduit de
l'exemple officiel 200€→50€), nombre de jours par mois (31, déduit des cases
23 et 31 citées dans la notice), palier de prêt (1500€) et frais de retrait
d'épargne (150€) — ces deux derniers pas encore câblés dans le moteur. Durée
de partie = 3 mois reste fixée par le cahier des charges (la notice laisse ce
nombre au choix des joueurs).

**Toujours en attente** : la notice confirme 4 catégories de cartes
(ACQUISITION ×23, PRÊT ×16, COURRIER ×50, ÉVÈNEMENT ×23) — à réconcilier avec
les 7 catégories actuelles du projet ; la disposition exacte du plateau (quel
jour propose quoi) reste volontairement ORIGINALE, pas copiée de la notice ;
les mécaniques d'enchère, Loterie, Cagnotte et Assurance sont décrites dans la
notice mais pas implémentées ; la méthode de classement final en cas d'égalité
n'est pas détaillée (le principe « le moins endetté gagne » si tout le monde
est en dette, lui, est confirmé).

Détail complet et bandeau de statut sur `/regles`.

## 4. Tests effectués

- Vitest : 10/10 tests passants (moteur + règles).
- `npx tsc --noEmit` : aucune erreur.
- `npx eslint src` : aucune erreur, aucun warning.
- `npm run build` : build de production réussi (8 routes générées).
- Vérification manuelle dans le navigateur (Chromium intégré) : menu → créer
  salon → salle d'attente → partie → lancer les dés → déplacement animé →
  résolution de carte → fin de tour → changement de joueur actif, à deux
  reprises ; page `/regles` ; responsive mobile 375px.

## 5. Sécurité

- Aucune clé secrète n'est présente dans le code (le client Supabase est
  conditionnel et désactivé tant que les variables d'environnement ne sont
  pas définies).
- Le moteur de jeu est écrit en pur (reducer), prêt à être rejoué côté serveur
  sans modification — c'est la condition pour qu'un jour, le client ne
  contrôle plus les dés ni les soldes.
- **Point d'attention** : tant que Supabase n'est pas branché, toute la
  logique tourne côté client (démo locale assumée). Ne jamais déployer cet
  état comme s'il s'agissait d'un serveur de confiance.

## 6. Lancer et déployer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start   # production locale
```

Déploiement (Vercel ou équivalent Next.js) : fonctionne tel quel pour la
démonstration locale. Pour le multijoueur réel, suivre `supabase/README.md`
puis définir les variables d'environnement listées dans
`.env.local.example` sur la plateforme d'hébergement avant de déployer.
