import { nanoid } from "nanoid";
import type { GameAction, GameState } from "./types";
import { applyTransaction, creditCash } from "./transactions";
import { economyRules } from "../rules/edition-2024";

/**
 * Transitions de phase autorisées. Toute action reçue hors de la phase
 * attendue est ignorée — c'est la base du contrôle serveur à terme
 * (actuellement appliqué localement, voir avertissement dans `types.ts`).
 */
const ALLOWED_PHASE_FOR_ACTION: Record<GameAction["type"], GameState["phase"][]> = {
  ROLL_DICE: ["awaiting-roll"],
  ACK_MOVE_COMPLETE: ["moving"],
  RESOLVE_TILE: ["resolving-tile"],
  RESOLVE_CARD_CHOICE: ["awaiting-card-decision"],
  APPLY_PAYMENT: ["awaiting-payment"],
  END_TURN: ["turn-end"],
  ADVANCE_MONTH: ["month-end"],
  END_GAME: ["game-end"],
};

function log(state: GameState, message: string): GameState {
  return {
    ...state,
    log: [...state.log, { id: nanoid(8), message, at: new Date().toISOString() }],
  };
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  const allowedPhases = ALLOWED_PHASE_FOR_ACTION[action.type];
  if (!allowedPhases.includes(state.phase)) {
    return log(
      state,
      `Action ${action.type} ignorée : phase actuelle "${state.phase}" ne l'autorise pas.`
    );
  }

  switch (action.type) {
    case "ROLL_DICE": {
      const total = action.dice[0] + action.dice[1];
      const activePlayer = state.players[state.activePlayerIndex];
      const boardLength = state.board.length;
      // Simplification en attente de vérification : le plateau de référence est une
      // spirale à sens unique (Départ -> Jour de paie), pas une boucle. Le bouclage
      // modulo ci-dessous est un choix d'implémentation provisoire, pas une règle confirmée.
      const nextPosition = (activePlayer.position + total) % boardLength;

      return log(
        {
          ...state,
          lastRoll: action.dice,
          phase: "moving",
          players: state.players.map((p, i) =>
            i === state.activePlayerIndex ? { ...p, position: nextPosition } : p
          ),
        },
        `${activePlayer.name} lance les dés : ${action.dice[0]} + ${action.dice[1]} = ${total}.`
      );
    }

    case "ACK_MOVE_COMPLETE": {
      return { ...state, phase: "resolving-tile" };
    }

    case "RESOLVE_TILE": {
      const activePlayer = state.players[state.activePlayerIndex];
      const tile = state.board[activePlayer.position];

      if (tile.type === "paie") {
        const nextState = applyTransaction(state, {
          id: `salary-${state.gameId}-${state.month}-${state.day}-${activePlayer.id}`,
          playerId: activePlayer.id,
          reason: "Jour de paie",
          mutate: (acc) => creditCash(acc, economyRules.salary.value),
        });
        return log(
          { ...nextState, phase: "turn-end" },
          `${activePlayer.name} atteint Jour de paie : +${economyRules.salary.value} €.`
        );
      }

      if (tile.type === "evenement" || tile.type === "notification") {
        return { ...state, phase: "awaiting-card-decision" };
      }

      return { ...state, phase: "turn-end" };
    }

    case "RESOLVE_CARD_CHOICE": {
      // Résolu via l'effet de la carte active — branché au niveau du store,
      // qui connaît la carte piochée (séparation moteur / contenu de carte).
      return { ...state, phase: "turn-end", activeCard: null };
    }

    case "APPLY_PAYMENT": {
      return { ...state, phase: "turn-end" };
    }

    case "END_TURN": {
      const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
      const wrapped = nextIndex === 0;
      return {
        ...state,
        activePlayerIndex: nextIndex,
        day: wrapped ? state.day + 1 : state.day,
        phase: wrapped && state.day + 1 > economyRules.daysPerMonth.value
          ? "month-end"
          : "awaiting-roll",
      };
    }

    case "ADVANCE_MONTH": {
      if (state.month >= economyRules.monthsPerGame.value) {
        return { ...state, phase: "game-end" };
      }
      return log(
        { ...state, month: state.month + 1, day: 1, phase: "awaiting-roll" },
        `Fin du mois ${state.month}. Début du mois ${state.month + 1}.`
      );
    }

    case "END_GAME": {
      return state;
    }

    default:
      return state;
  }
}
