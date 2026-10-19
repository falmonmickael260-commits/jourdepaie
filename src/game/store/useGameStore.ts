"use client";

/**
 * Store de simulation LOCALE du moteur de jeu (zustand).
 *
 * ⚠️ Ceci est une démonstration "canapé" (hotseat, un seul navigateur) du
 * moteur et de ses animations. ⚠️ Ce n'est PAS le multijoueur réseau réel :
 * tant que `supabase/` n'est pas déployé et connecté (voir supabase/README.md),
 * aucune action ici n'est synchronisée entre joueurs distants. Ne jamais
 * présenter cet écran comme une partie multijoueur en direct.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { GameState, PlayerTokenId } from "../engine/types";
import { reduceGame } from "../engine/state-machine";
import { resolveCardEffect } from "../engine/resolve-card";
import { economyRules, buildDraftBoardLayout, sampleCards } from "../rules/edition-2024";
import type { CardDefinition } from "../rules/types";

const TOKENS: PlayerTokenId[] = ["piece-or", "porte-monnaie", "cle", "horloge", "valise", "trefle"];

function createInitialState(playerNames: string[]): GameState {
  const board = buildDraftBoardLayout(economyRules.daysPerMonth.value);
  return {
    gameId: nanoid(10),
    rulesetVersion: "edition-2024-configurable-draft",
    phase: "awaiting-roll",
    month: 1,
    day: 1,
    activePlayerIndex: 0,
    players: playerNames.map((name, i) => ({
      id: nanoid(8),
      name,
      tokenId: TOKENS[i % TOKENS.length],
      position: 0,
      account: {
        cash: economyRules.startingCash.value,
        savings: 0,
        debt: 0,
        investments: 0,
      },
      connected: true,
    })),
    board,
    lastRoll: null,
    activeCard: null,
    transactions: [],
    log: [
      {
        id: nanoid(8),
        message: "Partie de démonstration locale initialisée (hotseat).",
        at: new Date().toISOString(),
      },
    ],
  };
}

interface GameStore {
  state: GameState;
  isRolling: boolean;
  isMoving: boolean;
  pendingCard: CardDefinition | null;
  rollDice: () => void;
  onMoveAnimationComplete: () => void;
  resolveTile: () => void;
  chooseCardOption: (optionIndex: number) => void;
  payPending: (amount: number, reason: string) => void;
  endTurn: () => void;
  restart: (playerNames: string[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(["Joueur 1", "Joueur 2", "Joueur 3"]),
  isRolling: false,
  isMoving: false,
  pendingCard: null,

  rollDice: () => {
    if (get().state.phase !== "awaiting-roll" || get().isRolling) return;
    set({ isRolling: true });

    const dice: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];

    setTimeout(() => {
      set((s) => ({
        state: reduceGame(s.state, { type: "ROLL_DICE", dice }),
        isRolling: false,
        isMoving: true,
      }));
    }, 900);
  },

  onMoveAnimationComplete: () => {
    set((s) => ({
      state: reduceGame(s.state, { type: "ACK_MOVE_COMPLETE" }),
      isMoving: false,
    }));
    get().resolveTile();
  },

  resolveTile: () => {
    set((s) => {
      const next = reduceGame(s.state, { type: "RESOLVE_TILE" });
      if (next.phase === "awaiting-card-decision") {
        const card = sampleCards[Math.floor(Math.random() * sampleCards.length)];
        return { state: next, pendingCard: card };
      }
      return { state: next, pendingCard: null };
    });
  },

  chooseCardOption: (optionIndex: number) => {
    const { pendingCard, state } = get();
    if (!pendingCard) return;

    const nextState = resolveCardEffect(state, pendingCard, optionIndex);

    set({
      state: reduceGame(nextState, { type: "RESOLVE_CARD_CHOICE", optionIndex }),
      pendingCard: null,
    });
  },

  payPending: () => {
    set((s) => ({ state: reduceGame(s.state, { type: "APPLY_PAYMENT" }) }));
  },

  endTurn: () => {
    set((s) => {
      const afterTurn = reduceGame(s.state, { type: "END_TURN" });
      if (afterTurn.phase === "month-end") {
        const afterMonth = reduceGame(afterTurn, { type: "ADVANCE_MONTH" });
        return { state: afterMonth };
      }
      return { state: afterTurn };
    });
  },

  restart: (playerNames: string[]) => {
    set({ state: createInitialState(playerNames), pendingCard: null, isRolling: false, isMoving: false });
  },
}));
