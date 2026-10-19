"use client";

import { Die } from "./Die";
import { useGameStore } from "@/game/store/useGameStore";
import { Button } from "@/components/ui/Button";
import { Dices } from "lucide-react";
import { useSfx } from "@/lib/audio/useSfx";

export function DiceRoller() {
  const phase = useGameStore((s) => s.state.phase);
  const isRolling = useGameStore((s) => s.isRolling);
  const lastRoll = useGameStore((s) => s.state.lastRoll);
  const rollDice = useGameStore((s) => s.rollDice);
  const playSfx = useSfx();

  const [d1, d2] = lastRoll ?? [1, 1];

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex gap-2 sm:gap-3 scale-[0.72] sm:scale-100 -my-2 sm:my-0">
        <Die value={d1} rolling={isRolling} />
        <Die value={d2} rolling={isRolling} />
      </div>
      {phase === "awaiting-roll" && (
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
    </div>
  );
}
