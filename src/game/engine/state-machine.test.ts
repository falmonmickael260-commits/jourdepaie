import { describe, expect, it } from "vitest";
import { reduceGame } from "./state-machine";
import type { GameState } from "./types";
import { economyRules, buildDraftBoardLayout } from "../rules/edition-2024";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "g1",
    rulesetVersion: "test",
    phase: "awaiting-roll",
    month: 1,
    day: 1,
    activePlayerIndex: 0,
    players: [
      {
        id: "p1",
        name: "Alice",
        tokenId: "piece-or",
        position: 0,
        account: { cash: 1000, savings: 0, debt: 0, investments: 0 },
        connected: true,
      },
      {
        id: "p2",
        name: "Bob",
        tokenId: "cle",
        position: 0,
        account: { cash: 1000, savings: 0, debt: 0, investments: 0 },
        connected: true,
      },
    ],
    board: buildDraftBoardLayout(economyRules.daysPerMonth.value),
    lastRoll: null,
    activeCard: null,
    transactions: [],
    log: [],
    ...overrides,
  };
}

describe("reduceGame — contrôle de phase", () => {
  it("ignore une action reçue hors de la phase autorisée", () => {
    const state = makeState({ phase: "turn-end" });
    const next = reduceGame(state, { type: "ROLL_DICE", dice: [3, 4] });
    expect(next.phase).toBe("turn-end");
    expect(next.players[0].position).toBe(0);
    expect(next.log.at(-1)?.message).toMatch(/ignorée/);
  });

  it("déplace le joueur actif selon la somme des dés et passe en phase 'moving'", () => {
    const state = makeState();
    const next = reduceGame(state, { type: "ROLL_DICE", dice: [2, 3] });
    expect(next.phase).toBe("moving");
    expect(next.players[0].position).toBe(5);
  });

  it("fait boucler la position sur la longueur du plateau", () => {
    const boardLength = buildDraftBoardLayout(economyRules.daysPerMonth.value).length;
    const state = makeState({ players: makeState().players.map((p) => ({ ...p, position: 26 })) });
    const next = reduceGame(state, { type: "ROLL_DICE", dice: [6, 6] });
    expect(next.players[0].position).toBe((26 + 12) % boardLength);
  });

  it("verse le salaire de façon idempotente en atteignant la case Jour de paie", () => {
    const lastIndex = buildDraftBoardLayout(economyRules.daysPerMonth.value).length - 1;
    let state = makeState({ phase: "resolving-tile", players: makeState().players.map((p) => ({ ...p, position: lastIndex })) });
    state = reduceGame(state, { type: "RESOLVE_TILE" });
    expect(state.players[0].account.cash).toBe(1000 + economyRules.salary.value);
    expect(state.phase).toBe("turn-end");

    // Rejouer la même résolution de tour ne doit pas re-créditer le salaire
    // (même identifiant de transaction = mois/jour/joueur inchangés).
    const replay = reduceGame({ ...state, phase: "resolving-tile" }, { type: "RESOLVE_TILE" });
    expect(replay.players[0].account.cash).toBe(1000 + economyRules.salary.value);
  });
});
