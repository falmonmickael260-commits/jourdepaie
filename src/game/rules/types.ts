/**
 * Statut de traçabilité d'une règle ou d'une valeur du jeu.
 *
 * - confirmed     : vérifié contre la notice de référence (voir `source`).
 * - pending       : valeur plausible mais NON vérifiée — ne pas utiliser en mode officiel.
 * - configurable  : paramètre volontairement laissé au choix de l'hôte de partie.
 * - unimplemented : mécanique identifiée mais pas encore codée.
 */
export type RuleStatus = "confirmed" | "pending" | "configurable" | "unimplemented";

export interface RuleSource {
  /** Référence documentaire interne : page de notice, section, ou identifiant de carte. */
  reference: string;
  note?: string;
}

/**
 * Enveloppe générique autour de toute valeur de règle.
 * Oblige chaque valeur du jeu à déclarer sa provenance et son niveau de confiance.
 */
export interface RuleValue<T> {
  value: T;
  status: RuleStatus;
  source?: RuleSource;
}

export function rule<T>(value: T, status: RuleStatus, source?: RuleSource): RuleValue<T> {
  return { value, status, source };
}

export type CardCategory =
  | "investir"
  | "encherir"
  | "evenement"
  | "notification"
  | "pret"
  | "epargne"
  | "anniversaire";

export interface CardDefinition {
  id: string;
  category: CardCategory;
  /** Titre et texte original (ne jamais recopier un texte protégé issu d'une édition commerciale). */
  title: string;
  description: string;
  /** Effet mécanique structuré, résolu par le moteur de jeu — pas de texte libre interprété au runtime. */
  effect: CardEffect;
  status: RuleStatus;
  source?: RuleSource;
}

export type CardEffect =
  | { type: "gain"; amount: number }
  | { type: "payment"; amount: number }
  | { type: "save"; amount: number }
  | { type: "payment-per-player"; amount: number; direction: "to-bank" | "from-each-player" }
  | { type: "choice"; options: CardChoiceOption[] }
  | { type: "move"; spaces: number }
  | { type: "move-to"; tileId: string }
  | { type: "no-op" };

export interface CardChoiceOption {
  label: string;
  effect: CardEffect;
}

export type TileType =
  | "jour"
  | "banque"
  | "commerce"
  | "loisir"
  | "evenement"
  | "notification"
  | "epargne"
  | "pret"
  | "depart"
  | "paie"
  | "anniversaire";

export interface TileDefinition {
  id: string;
  index: number;
  type: TileType;
  label: string;
  description?: string;
  status: RuleStatus;
  source?: RuleSource;
}
