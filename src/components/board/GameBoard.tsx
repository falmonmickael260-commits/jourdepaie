"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameBoard3D } from "./GameBoard3D";
import { useGameStore } from "@/game/store/useGameStore";
import type { TileDefinition } from "@/game/rules/types";
import { Landmark } from "lucide-react";

function PaydayCelebration() {
  const rays = Array.from({ length: 10 });
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      {rays.map((_, i) => {
        const angle = (i / rays.length) * 360;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              background: "radial-gradient(circle at 35% 30%, #f2e3bd, #b38a52 70%)",
              boxShadow: "0 0 6px rgba(230,205,150,0.9)",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 90,
              y: Math.sin((angle * Math.PI) / 180) * 90,
              opacity: 0,
              scale: 1,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
      <motion.div
        className="absolute rounded-full border-2 border-gold-400"
        style={{ width: 20, height: 20 }}
        initial={{ scale: 0.5, opacity: 0.9 }}
        animate={{ scale: 9, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

const FRAME_RIVETS = [
  { x: "6%", y: "6%" },
  { x: "94%", y: "6%" },
  { x: "6%", y: "94%" },
  { x: "94%", y: "94%" },
];

export function GameBoard() {
  const board = useGameStore((s) => s.state.board);
  const players = useGameStore((s) => s.state.players);
  const activePlayerIndex = useGameStore((s) => s.state.activePlayerIndex);
  const onMoveAnimationComplete = useGameStore((s) => s.onMoveAnimationComplete);
  const phase = useGameStore((s) => s.state.phase);
  const month = useGameStore((s) => s.state.month);
  const day = useGameStore((s) => s.state.day);
  const lastRoll = useGameStore((s) => s.state.lastRoll);
  const isRolling = useGameStore((s) => s.isRolling);

  const [selectedTile, setSelectedTile] = useState<TileDefinition | null>(null);
  const [payday, setPayday] = useState(false);

  const triggerPayday = useCallback(() => {
    setPayday(true);
    setTimeout(() => setPayday(false), 900);
  }, []);

  return (
    <div
      className="relative w-full aspect-square max-w-[720px] mx-auto rounded-[32px] p-[6px] sm:p-2 shadow-[var(--shadow-lifted)]"
      style={{
        background: "linear-gradient(155deg, #16594a 0%, #0a2f24 55%, #06241c 100%)",
      }}
    >
      {/* Liseré or */}
      <div className="absolute inset-[3px] sm:inset-1.5 rounded-[28px] border border-gold-400/50 pointer-events-none z-20" />

      {/* Rivets dorés aux angles du cadre */}
      {FRAME_RIVETS.map((r, i) => (
        <span
          key={i}
          className="absolute w-[5px] h-[5px] sm:w-2 sm:h-2 rounded-full z-20 pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 30%, #f2e3bd, #b38a52 70%)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />
      ))}

      {/* Plaque du titre, en applique sur le cadre */}
      <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 z-30 px-3 sm:px-4 py-1 rounded-full surface-gold shadow-[var(--shadow-gold-glow)]">
        <p className="font-display text-[0.6rem] sm:text-xs tracking-[0.18em] uppercase text-navy-950 whitespace-nowrap">
          En jour de paie
        </p>
      </div>

      <div className="relative w-full h-full rounded-[24px] overflow-hidden">
        <GameBoard3D
          board={board}
          players={players}
          activePlayerIndex={activePlayerIndex}
          phase={phase}
          lastRoll={lastRoll}
          isRolling={isRolling}
          onMoveAnimationComplete={onMoveAnimationComplete}
          onPayday={triggerPayday}
          onSelectTile={setSelectedTile}
        />

        {/* Médaillon central, en surimpression du plateau 3D. */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center text-center">
          <span className="surface-gold rounded-full p-2.5 sm:p-3.5 mb-1.5 sm:mb-2 shadow-[var(--shadow-gold-glow)]">
            <Landmark size={22} className="text-navy-950" />
          </span>
          <p className="font-display text-sm sm:text-xl text-ivory-50 leading-tight drop-shadow-md">
            Jour de paie
          </p>
          <p className="font-sans text-[0.55rem] sm:text-[0.65rem] tracking-[0.18em] uppercase text-gold-300/90 mt-0.5 drop-shadow-md">
            Mois {month} · Jour {day}
          </p>
        </div>

        <AnimatePresence>{payday && <PaydayCelebration key="payday" />}</AnimatePresence>
      </div>

      {selectedTile && (
        <div
          role="dialog"
          aria-label={selectedTile.label}
          className="absolute inset-x-4 bottom-4 sm:left-4 sm:right-auto sm:bottom-4 sm:w-72 bg-navy-950 text-ivory-50 rounded-xl p-4 shadow-[var(--shadow-lifted)] z-30"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{selectedTile.label}</p>
              {selectedTile.status === "configurable" && (
                <p className="text-xs text-gold-300/80 mt-1">
                  Disposition originale de ce projet — la notice officielle ne publie pas la
                  répartition exacte des cases.
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedTile(null)}
              className="text-ivory-50/60 hover:text-ivory-50 text-sm cursor-pointer"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
