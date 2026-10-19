import { describe, expect, it } from "vitest";
import { applyTransaction, creditCash } from "./transactions";
import type { GameState } from "./types";

function makeState(): GameState {
  return {
    gameId: "g1",
    rulesetVersion: "test",
    phase: "turn-end",
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
    ],
    board: [],
    lastRoll: null,
    activeCard: null,
    transactions: [],
    log: [],
  };
}

describe("applyTransaction", () => {
  it("credits a player's cash and records the transaction", () => {
    const state = makeState();
    const next = applyTransaction(state, {
      id: "tx-1",
      playerId: "p1",
      reason: "test credit",
      mutate: (acc) => creditCash(acc, 200),
    });

    expect(next.players[0].account.cash).toBe(1200);
    expect(next.transactions).toHaveLength(1);
    expect(next.transactions[0].amount).toBe(200);
  });

  it("is idempotent: replaying the same transaction id has no further effect", () => {
    const state = makeState();
    const once = applyTransaction(state, {
      id: "tx-dup",
      playerId: "p1",
      reason: "salary",
      mutate: (acc) => creditCash(acc, 400),
    });
    const twice = applyTransaction(once, {
      id: "tx-dup",
      playerId: "p1",
      reason: "salary",
      mutate: (acc) => creditCash(acc, 400),
    });

    expect(twice.players[0].account.cash).toBe(1400);
    expect(twice.transactions).toHaveLength(1);
  });

  it("ignores transactions for an unknown player", () => {
    const state = makeState();
    const next = applyTransaction(state, {
      id: "tx-ghost",
      playerId: "does-not-exist",
      reason: "noop",
      mutate: (acc) => creditCash(acc, 50),
    });
    expect(next).toBe(state);
  });
});
