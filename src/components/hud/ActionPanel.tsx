"use client";

import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { DiceRoller } from "@/components/board/DiceRoller";
import { useGameStore } from "@/game/store/useGameStore";
import { useLobbyStore } from "@/game/store/useLobbyStore";
import { useSfx } from "@/lib/audio/useSfx";
import { ArrowRight, Loader2 } from "lucide-react";

const PHASE_LABEL: Record<string, string> = {
  "waiting-room": "En attente de joueurs",
  "turn-start": "Début de tour",
  "awaiting-roll": "À vous de lancer les dés",
  moving: "Déplacement en cours",
  "resolving-tile": "Résolution de la case",
  "awaiting-card-decision": "Décision requise",
  "awaiting-payment": "Paiement à effectuer",
  "turn-end": "Tour terminé",
  "month-end": "Fin de mois",
  "game-end": "Partie terminée",
};

export function ActionPanel() {
  const phase = useGameStore((s) => s.state.phase);
  const endTurn = useGameStore((s) => s.endTurn);
  const month = useGameStore((s) => s.state.month);
  const activePlayer = useGameStore((s) => s.state.players[s.state.activePlayerIndex]);
  const lobby = useLobbyStore((s) => s.lobby);
  const myPlayerId = useLobbyStore((s) => s.myPlayerId);
  const isMyTurn = !lobby || myPlayerId === activePlayer?.id;
  const playSfx = useSfx();

  const phaseLabel = isMyTurn
    ? PHASE_LABEL[phase] ?? phase
    : phase === "awaiting-roll" || phase === "turn-end"
      ? `Tour de ${activePlayer?.name ?? "l'adversaire"}`
      : PHASE_LABEL[phase] ?? phase;

  return (
    <div className="fixed inset-x-3 z-40 lg:static lg:inset-auto" style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <Panel
        tone="dark"
        className="flex flex-col items-center gap-2 sm:gap-4 min-h-[108px] sm:min-h-[180px] py-3 sm:py-5 justify-center"
      >
        <p className="text-xs tracking-[0.2em] uppercase text-gold-300/80 font-sans">{phaseLabel}</p>

        {phase === "awaiting-roll" && <DiceRoller />}

        {(phase === "moving" || phase === "resolving-tile") && (
          <Loader2 className="animate-spin text-gold-400" size={28} />
        )}

        {phase === "turn-end" && isMyTurn && (
          <Button
            icon={<ArrowRight size={18} />}
            onClick={() => {
              playSfx("click");
              endTurn();
            }}
          >
            Terminer le tour
          </Button>
        )}

        {phase === "turn-end" && !isMyTurn && (
          <p className="text-sm text-ivory-100/50 font-sans text-center">
            En attente que {activePlayer?.name} termine son tour…
          </p>
        )}

        {phase === "game-end" && (
          <p className="font-display text-xl text-gold-300 text-center">
            Partie terminée — mois {month} de 3 écoulés.
          </p>
        )}
      </Panel>
    </div>
  );
}
