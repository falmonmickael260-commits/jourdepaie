"use client";

import { use, useEffect, useRef } from "react";
import { TopBar } from "@/components/hud/TopBar";
import { FinancialPanel } from "@/components/hud/FinancialPanel";
import { OpponentsPanel } from "@/components/hud/OpponentsPanel";
import { ActionPanel } from "@/components/hud/ActionPanel";
import { GameBoard } from "@/components/board/GameBoard";
import { CardOverlay } from "@/components/board/CardOverlay";
import { useGameStore } from "@/game/store/useGameStore";
import { useLobbyStore } from "@/game/store/useLobbyStore";
import { useSfx } from "@/lib/audio/useSfx";

export default function PartiePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const month = useGameStore((s) => s.state.month);
  const phase = useGameStore((s) => s.state.phase);
  const restart = useGameStore((s) => s.restart);
  const lobby = useLobbyStore((s) => s.lobby);
  const playSfx = useSfx();
  const prevMonth = useRef(month);
  const prevPhase = useRef(phase);
  const initializedForCode = useRef<string | null>(null);

  // La partie doit démarrer avec exactement les joueurs du salon (pas une
  // liste fixe de 3 "Joueur 1/2/3" — sinon un salon à 2 joueurs se
  // retrouvait quand même avec un 3e pion fantôme qui joue tout seul).
  useEffect(() => {
    if (lobby && lobby.code === code && initializedForCode.current !== code) {
      initializedForCode.current = code;
      restart(lobby.players.map((p) => p.name));
    }
  }, [code, lobby, restart]);

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
