import type { GameState } from "./types";
import { applyTransaction, creditCash, debitCash } from "./transactions";
import type { CardDefinition } from "../rules/types";

/**
 * Applique l'effet d'une carte (ou de l'option choisie si c'est un choix) à
 * l'état du jeu, de façon transactionnelle et idempotente. Extrait du store
 * pour rester une fonction pure testable indépendamment de Zustand/React.
 */
export function resolveCardEffect(
  state: GameState,
  card: CardDefinition,
  optionIndex: number
): GameState {
  const activePlayer = state.players[state.activePlayerIndex];
  let effect = card.effect;
  if (effect.type === "choice") {
    effect = effect.options[optionIndex]?.effect ?? { type: "no-op" };
  }

  const txId = `card-${card.id}-${state.gameId}-${state.month}-${state.day}-${activePlayer.id}`;

  if (effect.type === "payment") {
    return applyTransaction(state, {
      id: txId,
      playerId: activePlayer.id,
      reason: card.title,
      mutate: (acc) => debitCash(acc, effect.amount),
    });
  }

  if (effect.type === "gain") {
    return applyTransaction(state, {
      id: txId,
      playerId: activePlayer.id,
      reason: card.title,
      mutate: (acc) => creditCash(acc, effect.amount),
    });
  }

  if (effect.type === "save") {
    return applyTransaction(state, {
      id: txId,
      playerId: activePlayer.id,
      reason: card.title,
      mutate: (acc) => ({
        ...debitCash(acc, effect.amount),
        savings: acc.savings + effect.amount,
      }),
    });
  }

  if (effect.type === "payment-per-player") {
    const others = state.players.filter((p) => p.id !== activePlayer.id);
    let next = state;
    for (const other of others) {
      const pairId = `${txId}-${other.id}`;
      if (effect.direction === "from-each-player") {
        next = applyTransaction(next, {
          id: `${pairId}-debit`,
          playerId: other.id,
          reason: card.title,
          mutate: (acc) => debitCash(acc, effect.amount),
        });
        next = applyTransaction(next, {
          id: `${pairId}-credit`,
          playerId: activePlayer.id,
          reason: card.title,
          mutate: (acc) => creditCash(acc, effect.amount),
        });
      } else {
        next = applyTransaction(next, {
          id: `${pairId}-debit`,
          playerId: activePlayer.id,
          reason: card.title,
          mutate: (acc) => debitCash(acc, effect.amount),
        });
      }
    }
    return next;
  }

  return state;
}
