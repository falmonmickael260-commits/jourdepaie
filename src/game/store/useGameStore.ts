"use client";

/**
 * Store du moteur de jeu (zustand), à DOUBLE mode :
 *
 * - Mode RÉSEAU (dès qu'un salon réel existe, voir useLobbyStore) : les
 *   actions (lancer les dés, choisir une carte, terminer le tour) sont
 *   envoyées au serveur (voir `server.ts`) qui est seul à faire tourner le
 *   moteur et à distribuer les cartes ; ce store ne fait qu'appliquer les
 *   diffusions reçues. C'est ce qui garantit que deux appareils voient
 *   exactement le même dé, et que seul le joueur actif peut agir pour lui.
 * - Mode LOCAL (pas de salon — ex. /partie/demo) : simulation "canapé"
 *   hotseat dans ce seul navigateur, comme avant, pour pouvoir tester sans
 *   serveur.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { GameState, PlayerTokenId } from "../engine/types";
import { reduceGame } from "../engine/state-machine";
import { resolveCardEffect } from "../engine/resolve-card";
import { economyRules, buildDraftBoardLayout, sampleCards } from "../rules/edition-2024";
import { useLobbyStore } from "./useLobbyStore";
import { onMessage, sendMessage, type ServerMessage } from "@/lib/realtime/socket";

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
  rollDice: () => void;
  onMoveAnimationComplete: () => void;
  resolveTile: () => void;
  chooseCardOption: (optionIndex: number) => void;
  endTurn: () => void;
  restart: (playerNames: string[]) => void;
  /** Demande au serveur l'état courant de la partie réseau (voir note plus bas). */
  requestSync: () => void;
}

/** Y a-t-il un vrai salon réseau pour cette partie ? Sinon, simulation locale. */
function isNetworked(): boolean {
  return useLobbyStore.getState().lobby !== null;
}

onMessage((msg: ServerMessage) => {
  if (msg.type === "game") {
    useGameStore.setState({ state: msg.game as GameState, isRolling: false });
    return;
  }
  if (msg.type === "rolling") {
    useGameStore.setState({ isRolling: true });
    return;
  }
});

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(["Joueur 1", "Joueur 2", "Joueur 3"]),
  isRolling: false,

  rollDice: () => {
    if (get().state.phase !== "awaiting-roll" || get().isRolling) return;

    if (isNetworked()) {
      sendMessage({ type: "roll" });
      return;
    }

    set({ isRolling: true });
    const dice: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];

    setTimeout(() => {
      set((s) => ({
        state: reduceGame(s.state, { type: "ROLL_DICE", dice }),
        isRolling: false,
      }));
    }, 900);
  },

  onMoveAnimationComplete: () => {
    if (isNetworked()) {
      sendMessage({ type: "ack_move" });
      return;
    }

    set((s) => ({
      state: reduceGame(s.state, { type: "ACK_MOVE_COMPLETE" }),
    }));
    get().resolveTile();
  },

  resolveTile: () => {
    // Mode local uniquement — en réseau, c'est le serveur qui résout la case
    // et choisit la carte, pour que tous les appareils voient la même chose.
    set((s) => {
      const next = reduceGame(s.state, { type: "RESOLVE_TILE" });
      if (next.phase === "awaiting-card-decision") {
        const card = sampleCards[Math.floor(Math.random() * sampleCards.length)];
        return { state: { ...next, activeCard: card } };
      }
      return { state: next };
    });
  },

  chooseCardOption: (optionIndex: number) => {
    if (isNetworked()) {
      sendMessage({ type: "choose_card", optionIndex });
      return;
    }

    const { state } = get();
    if (!state.activeCard) return;
    const nextState = resolveCardEffect(state, state.activeCard, optionIndex);
    set({ state: reduceGame(nextState, { type: "RESOLVE_CARD_CHOICE", optionIndex }) });
  },

  endTurn: () => {
    if (isNetworked()) {
      sendMessage({ type: "end_turn" });
      return;
    }

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
    set({ state: createInitialState(playerNames), isRolling: false });
  },

  requestSync: () => {
    // Le salon et la partie ne partagent pas le même code JS (Next.js
    // découpe par route) : au moment où le serveur diffuse l'état initial
    // de la partie (juste après "start"), cette page et son écouteur de
    // messages n'existent peut-être pas encore. On redemande donc l'état
    // explicitement au montage plutôt que de compter uniquement sur cette
    // diffusion, qui peut avoir eu lieu avant que quiconque ne l'écoute.
    sendMessage({ type: "request_game" });
  },
}));
