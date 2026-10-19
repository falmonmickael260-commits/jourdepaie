import { describe, expect, it } from "vitest";
import { reduceGame } from "./state-machine";
import { resolveCardEffect } from "./resolve-card";
import { economyRules, buildDraftBoardLayout, sampleCards } from "../rules/edition-2024";
import type { GameState, PlayerTokenId } from "./types";

function createGame(playerNames: string[]): GameState {
  const board = buildDraftBoardLayout(economyRules.daysPerMonth.value);
  const tokens: PlayerTokenId[] = ["piece-or", "porte-monnaie", "cle"];
  return {
    gameId: "test-game",
    rulesetVersion: "test",
    phase: "awaiting-roll",
    month: 1,
    day: 1,
    activePlayerIndex: 0,
    players: playerNames.map((name, i) => ({
      id: `p${i}`,
      name,
      tokenId: tokens[i % tokens.length],
      position: 0,
      account: { cash: economyRules.startingCash.value, savings: 0, debt: 0, investments: 0 },
      connected: true,
    })),
    board,
    lastRoll: null,
    activeCard: null,
    transactions: [],
    log: [],
  };
}

/** PRNG déterministe (LCG) pour des parties simulées reproductibles. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function playFullGame(seed: number, playerNames: string[]) {
  const rng = makeRng(seed);
  let state = createGame(playerNames);

  let steps = 0;
  const MAX_STEPS = 20000;

  while (state.phase !== "game-end" && steps < MAX_STEPS) {
    steps++;

    switch (state.phase) {
      case "awaiting-roll": {
        const d1 = 1 + Math.floor(rng() * 6);
        const d2 = 1 + Math.floor(rng() * 6);
        state = reduceGame(state, { type: "ROLL_DICE", dice: [d1, d2] });
        break;
      }
      case "moving": {
        state = reduceGame(state, { type: "ACK_MOVE_COMPLETE" });
        break;
      }
      case "resolving-tile": {
        state = reduceGame(state, { type: "RESOLVE_TILE" });
        break;
      }
      case "awaiting-card-decision": {
        const card = sampleCards[Math.floor(rng() * sampleCards.length)];
        let optionIndex = 0;
        if (card.effect.type === "choice") {
          optionIndex = Math.floor(rng() * card.effect.options.length);
        }
        const resolved = resolveCardEffect(state, card, optionIndex);
        state = reduceGame(resolved, { type: "RESOLVE_CARD_CHOICE", optionIndex });
        break;
      }
      case "awaiting-payment": {
        state = reduceGame(state, { type: "APPLY_PAYMENT" });
        break;
      }
      case "turn-end": {
        state = reduceGame(state, { type: "END_TURN" });
        if (state.phase === "month-end") {
          state = reduceGame(state, { type: "ADVANCE_MONTH" });
        }
        break;
      }
      default: {
        // Phase inattendue (ex: "turn-start", jamais produite par le moteur actuel) :
        // on arrête la boucle plutôt que de tourner indéfiniment.
        steps = MAX_STEPS;
      }
    }

    for (const p of state.players) {
      expect(Number.isFinite(p.account.cash)).toBe(true);
      expect(Number.isFinite(p.account.savings)).toBe(true);
      expect(p.position).toBeGreaterThanOrEqual(0);
      expect(p.position).toBeLessThan(state.board.length);
    }
    expect(state.month).toBeGreaterThanOrEqual(1);
    expect(state.month).toBeLessThanOrEqual(economyRules.monthsPerGame.value);
  }

  return { state, steps };
}

describe("Partie complète — simulation de bout en bout", () => {
  it("joue une partie de 3 mois sans erreur et atteint game-end", () => {
    const { state, steps } = playFullGame(42, ["Alice", "Bob", "Charlie"]);

    expect(state.phase).toBe("game-end");
    expect(state.month).toBe(economyRules.monthsPerGame.value);
    expect(steps).toBeLessThan(20000);

    for (const p of state.players) {
      const salaryTx = state.transactions.filter(
        (t) => t.playerId === p.id && t.reason === "Jour de paie"
      );
      expect(salaryTx.length).toBeGreaterThan(0);
    }

    // Idempotence : aucun identifiant de transaction ne doit jamais être dupliqué.
    const ids = state.transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reste cohérente sur plusieurs graines aléatoires et tailles de table", () => {
    for (const seed of [1, 7, 99, 1234]) {
      for (const names of [["Solo"], ["Duo A", "Duo B"], ["A", "B", "C", "D", "E", "F"]]) {
        const { state } = playFullGame(seed, names);
        expect(state.phase).toBe("game-end");
        const ids = state.transactions.map((t) => t.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const p of state.players) {
          expect(Number.isFinite(p.account.cash)).toBe(true);
        }
      }
    }
  });
});
