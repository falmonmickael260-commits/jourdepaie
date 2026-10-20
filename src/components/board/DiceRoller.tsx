"use client";

import { Die } from "./Die";
import { useGameStore } from "@/game/store/useGameStore";
import { useLobbyStore } from "@/game/store/useLobbyStore";
import { Button } from "@/components/ui/Button";
import { Dices } from "lucide-react";
import { useSfx } from "@/lib/audio/useSfx";

export function DiceRoller() {
  const phase = useGameStore((s) => s.state.phase);
  const isRolling = useGameStore((s) => s.isRolling);
  const lastRoll = useGameStore((s) => s.state.lastRoll);
  const activePlayer = useGameStore((s) => s.state.players[s.state.activePlayerIndex]);
  const rollDice = useGameStore((s) => s.rollDice);
  const lobby = useLobbyStore((s) => s.lobby);
  const myPlayerId = useLobbyStore((s) => s.myPlayerId);
  const isMyTurn = !lobby || myPlayerId === activePlayer?.id;
  const playSfx = useSfx();

  const [d1, d2] = lastRoll ?? [1, 1];

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex gap-2 sm:gap-3 scale-[0.72] sm:scale-100 -my-2 sm:my-0">
        <Die value={d1} rolling={isRolling} />
        <Die value={d2} rolling={isRolling} />
      </div>
      {phase === "awaiting-roll" && isMyTurn && (
        <Button
          icon={<Dices size={18} />}
          onClick={() => {
            playSfx("dice-roll");
            rollDice();
          }}
          disabled={isRolling}
        >
          Lancer les dés
        </Button>
      )}
      {phase === "awaiting-roll" && !isMyTurn && (
        <p className="text-sm text-ivory-100/50 font-sans text-center">
          En attente que {activePlayer?.name} lance les dés…
        </p>
      )}
    </div>
  );
}
