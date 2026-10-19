"use client";

import { useEffect, useRef } from "react";
import { TopBar } from "@/components/hud/TopBar";
import { FinancialPanel } from "@/components/hud/FinancialPanel";
import { OpponentsPanel } from "@/components/hud/OpponentsPanel";
import { ActionPanel } from "@/components/hud/ActionPanel";
import { GameBoard } from "@/components/board/GameBoard";
import { CardOverlay } from "@/components/board/CardOverlay";
import { useGameStore } from "@/game/store/useGameStore";
import { useSfx } from "@/lib/audio/useSfx";

export default function PartiePage() {
  const month = useGameStore((s) => s.state.month);
  const phase = useGameStore((s) => s.state.phase);
  const playSfx = useSfx();
  const prevMonth = useRef(month);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (month !== prevMonth.current) {
      playSfx("month-end");
      prevMonth.current = month;
    }
    if (phase === "game-end" && prevPhase.current !== "game-end") {
      playSfx("victory");
    }
    prevPhase.current = phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, phase]);

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      <TopBar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-32 lg:pb-6 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-5 items-start">
        <div className="order-2 lg:order-1 flex flex-col gap-4">
          <FinancialPanel />
        </div>

        <div className="order-1 lg:order-2">
          <GameBoard />
        </div>

        <div className="order-3 flex flex-col gap-4">
          <OpponentsPanel />
          <ActionPanel />
        </div>
      </div>

      <p className="text-center text-xs text-navy-900/40 font-sans pb-6 px-4">
        Le salon (création/jointure) est bien partagé en temps réel entre appareils.
        La partie elle-même, une fois lancée, est encore simulée localement sur
        chaque appareil (démonstration hotseat) : dés, cartes et soldes ne sont pas
        encore synchronisés entre joueurs distants pendant le jeu.
      </p>

      <CardOverlay />
    </div>
  );
}
