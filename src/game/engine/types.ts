/**
 * Moteur de jeu — types partagés.
 *
 * IMPORTANT : tant qu'aucun backend temps réel (Supabase) n'est connecté,
 * ce moteur tourne en SIMULATION LOCALE dans le navigateur (mode "canapé" /
 * hotseat, un seul appareil). Ce n'est pas du multijoueur réseau réel.
 * Voir `src/game/store/useGameStore.ts` et `supabase/README.md`.
 */

import type { CardDefinition, TileDefinition } from "../rules/types";

export type GamePhase =
  | "waiting-room"
  | "turn-start"
  | "awaiting-roll"
  | "moving"
  | "resolving-tile"
  | "awaiting-card-decision"
  | "awaiting-payment"
  | "turn-end"
  | "month-end"
  | "game-end";

export interface PlayerAccount {
  cash: number;
  savings: number;
  debt: number;
  investments: number;
}

export interface PlayerState {
  id: string;
  name: string;
  tokenId: PlayerTokenId;
  position: number;
  account: PlayerAccount;
  connected: boolean;
}

export type PlayerTokenId =
  | "piece-or"
  | "porte-monnaie"
  | "cle"
  | "horloge"
  | "valise"
  | "trefle";

export interface Transaction {
  id: string;
  gameId: string;
  playerId: string;
  amount: number;
  reason: string;
  balanceBefore: PlayerAccount;
  balanceAfter: PlayerAccount;
  createdAt: string;
}

export interface GameState {
  gameId: string;
  rulesetVersion: string;
  phase: GamePhase;
  month: number;
  day: number;
  activePlayerIndex: number;
  players: PlayerState[];
  board: TileDefinition[];
  lastRoll: [number, number] | null;
  activeCard: CardDefinition | null;
  transactions: Transaction[];
  log: GameLogEntry[];
}

export interface GameLogEntry {
  id: string;
  message: string;
  at: string;
}

export type GameAction =
  | { type: "ROLL_DICE"; dice: [number, number] }
  | { type: "ACK_MOVE_COMPLETE" }
  | { type: "RESOLVE_TILE" }
  | { type: "RESOLVE_CARD_CHOICE"; optionIndex: number }
  | { type: "APPLY_PAYMENT" }
  | { type: "END_TURN" }
  | { type: "ADVANCE_MONTH" }
  | { type: "END_GAME" };
