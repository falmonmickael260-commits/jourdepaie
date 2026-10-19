import type { GameState, PlayerAccount, Transaction } from "./types";

/**
 * Applique une opération financière à un joueur de façon idempotente :
 * si une transaction portant le même `id` a déjà été appliquée, elle est ignorée.
 * C'est la garantie exigée par le cahier des charges : une requête répétée
 * (ex. re-émission réseau après coupure) ne doit jamais débiter/créditer deux fois.
 */
export function applyTransaction(
  state: GameState,
  input: {
    id: string;
    playerId: string;
    reason: string;
    mutate: (account: PlayerAccount) => PlayerAccount;
  }
): GameState {
  if (state.transactions.some((t) => t.id === input.id)) {
    return state;
  }

  const player = state.players.find((p) => p.id === input.playerId);
  if (!player) return state;

  const before = player.account;
  const after = input.mutate({ ...before });

  const transaction: Transaction = {
    id: input.id,
    gameId: state.gameId,
    playerId: input.playerId,
    amount: after.cash - before.cash,
    reason: input.reason,
    balanceBefore: before,
    balanceAfter: after,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === input.playerId ? { ...p, account: after } : p
    ),
    transactions: [...state.transactions, transaction],
  };
}

export function creditCash(account: PlayerAccount, amount: number): PlayerAccount {
  return { ...account, cash: account.cash + amount };
}

export function debitCash(account: PlayerAccount, amount: number): PlayerAccount {
  return { ...account, cash: account.cash - amount };
}
