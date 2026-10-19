"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { computeSpiralLayout, tokenOffset } from "@/data/board-geometry";
import { BoardTile } from "./BoardTile";
import { AnimatedPlayerMarker } from "./AnimatedPlayerMarker";
import { useGameStore } from "@/game/store/useGameStore";
import type { TileDefinition } from "@/game/rules/types";
import { Landmark } from "lucide-react";

interface Burst {
  key: number;
  xPct: number;
  yPct: number;
}

function TileBurst({ xPct, yPct }: { xPct: number; yPct: number }) {
  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        className="rounded-full border-2 border-gold-400"
        style={{ width: 14, height: 14, marginLeft: -7, marginTop: -7 }}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{ scale: 5, opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
    </div>
  );
}

function StepDust({ xPct, yPct }: { xPct: number; yPct: number }) {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ left: `${xPct}%`, top: `${yPct}%`, transform: "translate(-50%, -50%)" }}
    >
      <motion.div
        className="rounded-full bg-gold-400"
        style={{ width: 5, height: 5, marginLeft: -2.5, marginTop: -2.5 }}
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 0.3, opacity: 0, y: -4 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

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

function PathArrow({ xPct, yPct, angle }: { xPct: number; yPct: number; angle: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }}
    >
      <svg viewBox="0 0 16 16" width={10} height={10}>
        <path
          d="M2 2 L13 8 L2 14 Z"
          fill="#95582e"
          fillOpacity={0.55}
        />
      </svg>
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
  const isMoving = useGameStore((s) => s.isMoving);
  const month = useGameStore((s) => s.state.month);
  const day = useGameStore((s) => s.state.day);

  const [selectedTile, setSelectedTile] = useState<TileDefinition | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [dust, setDust] = useState<Burst[]>([]);
  const [payday, setPayday] = useState(false);
  const burstKey = useRef(0);
  const dustKey = useRef(0);

  const { tiles: layout, hubBounds } = useMemo(() => computeSpiralLayout(board.length), [board.length]);

  const pathPoints = useMemo(
    () => layout.map((t) => `${t.xPct},${t.yPct}`).join(" "),
    [layout]
  );

  const arrows = useMemo(
    () =>
      layout.slice(0, -1).map((t, i) => {
        const next = layout[i + 1];
        const dx = next.xPct - t.xPct;
        const dy = next.yPct - t.yPct;
        return {
          key: i,
          xPct: t.xPct + dx * 0.55,
          yPct: t.yPct + dy * 0.55,
          angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        };
      }),
    [layout]
  );

  const triggerBurst = useCallback(
    (tileIndex: number) => {
      const placement = layout[tileIndex];
      if (!placement) return;
      const key = burstKey.current++;
      setBursts((prev) => [...prev, { key, xPct: placement.xPct, yPct: placement.yPct }]);
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.key !== key)), 700);

      if (board[tileIndex]?.type === "paie") {
        setPayday(true);
        setTimeout(() => setPayday(false), 900);
      }
    },
    [layout, board]
  );

  const triggerDust = useCallback(
    (tileIndex: number) => {
      const placement = layout[tileIndex];
      if (!placement) return;
      const key = dustKey.current++;
      setDust((prev) => [...prev, { key, xPct: placement.xPct, yPct: placement.yPct }]);
      setTimeout(() => setDust((prev) => prev.filter((d) => d.key !== key)), 550);
    },
    [layout]
  );

  const tilesByPosition = useMemo(() => {
    const map = new Map<number, typeof players>();
    players.forEach((p) => {
      const list = map.get(p.position) ?? [];
      list.push(p);
      map.set(p.position, list);
    });
    return map;
  }, [players]);

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

      <div
        className="relative w-full h-full rounded-[24px] overflow-hidden grain-overlay"
        style={{
          background: "radial-gradient(120% 120% at 50% 50%, #fdfaf1 0%, #f4ecd8 58%, #e4d3ac 100%)",
        }}
      >
        {/* Lavis colorés aux quatre quartiers — rompent la monotonie du parchemin */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              "radial-gradient(42% 42% at 16% 16%, rgba(22,89,74,0.16), transparent 70%)",
              "radial-gradient(42% 42% at 84% 16%, rgba(212,175,122,0.22), transparent 70%)",
              "radial-gradient(42% 42% at 16% 84%, rgba(147,64,59,0.12), transparent 70%)",
              "radial-gradient(42% 42% at 84% 84%, rgba(149,88,46,0.18), transparent 70%)",
            ].join(","),
          }}
        />

        {/* Motif pointillé discret */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#95582e 0.6px, transparent 0.6px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Tracé de la spirale — piste fixe + lumière qui circule en continu */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#95582e"
            strokeOpacity={0.28}
            strokeWidth={0.7}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#d4af7a"
            strokeWidth={0.9}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="ejdp-dash-flow"
            pathLength={400}
          />
        </svg>

        {arrows.map((a) => (
          <PathArrow key={a.key} xPct={a.xPct} yPct={a.yPct} angle={a.angle} />
        ))}

        {/* Médaillon central — aligné exactement sur le bloc libre de la spirale */}
        <div
          className="absolute"
          style={{
            left: `${hubBounds.xPct}%`,
            top: `${hubBounds.yPct}%`,
            width: `${hubBounds.wPct}%`,
            height: `${hubBounds.hPct}%`,
          }}
        >
          {/* Socle en losange, à l'image d'un véritable plateau imprimé */}
          <div
            className="absolute inset-[15%]"
            style={{
              transform: "rotate(45deg)",
              background: "linear-gradient(155deg, #1f7260 0%, #16594a 55%, #0a2f24 100%)",
              border: "1px solid rgba(212,175,122,0.4)",
              boxShadow: "0 6px 18px rgba(6,36,24,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          />

          <div
            className="absolute inset-0 rounded-full ejdp-pulse-glow"
            style={{ background: "radial-gradient(circle, rgba(212,175,122,0.35), transparent 70%)" }}
          />
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full ejdp-ring-spin" aria-hidden>
            <circle cx={50} cy={50} r={47} fill="none" stroke="#95582e" strokeOpacity={0.45} strokeWidth={1.1} strokeDasharray="3 6" />
          </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full ejdp-ring-spin-slow" aria-hidden>
            <circle cx={50} cy={50} r={41} fill="none" stroke="#d4af7a" strokeOpacity={0.7} strokeWidth={0.9} strokeDasharray="1 4" />
          </svg>

          <div className="absolute inset-[10%] rounded-full border border-copper-600/25 bg-gradient-to-b from-white/60 to-transparent flex flex-col items-center justify-center text-center shadow-[inset_0_2px_12px_rgba(149,88,46,0.15)]">
            <span className="surface-gold rounded-full p-2.5 sm:p-3.5 mb-1.5 sm:mb-2 shadow-[var(--shadow-gold-glow)]">
              <Landmark size={22} className="text-navy-950" />
            </span>
            <p className="font-display text-sm sm:text-xl text-navy-900 leading-tight">Jour de paie</p>
            <p className="font-sans text-[0.55rem] sm:text-[0.65rem] tracking-[0.18em] uppercase text-copper-700/70 mt-0.5">
              Mois {month} · Jour {day}
            </p>
          </div>
        </div>

        {layout.map((placement) => (
          <BoardTile
            key={placement.index}
            tile={board[placement.index]}
            xPct={placement.xPct}
            yPct={placement.yPct}
            isCorner={placement.isTurn}
            isActive={players[activePlayerIndex]?.position === placement.index}
            isResolved={false}
            index={placement.index}
            onSelect={setSelectedTile}
          />
        ))}

        {players.map((player, i) => {
          const occupants = tilesByPosition.get(player.position) ?? [];
          const slot = occupants.findIndex((p) => p.id === player.id);
          const { dx, dy } = tokenOffset(slot, occupants.length);
          const isActivePlayer = i === activePlayerIndex;
          return (
            <AnimatedPlayerMarker
              key={player.id}
              tokenId={player.tokenId}
              position={player.position}
              layout={layout}
              dx={dx}
              dy={dy}
              isActive={isActivePlayer}
              bobDelay={i * 0.4}
              onStep={isActivePlayer ? triggerDust : undefined}
              onArrived={() => {
                triggerBurst(player.position);
                if (isActivePlayer && isMoving) onMoveAnimationComplete();
              }}
            />
          );
        })}

        <AnimatePresence>
          {dust.map((d) => (
            <StepDust key={d.key} xPct={d.xPct} yPct={d.yPct} />
          ))}
          {bursts.map((b) => (
            <TileBurst key={b.key} xPct={b.xPct} yPct={b.yPct} />
          ))}
        </AnimatePresence>

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
              {selectedTile.status !== "confirmed" && (
                <p className="text-xs text-gold-300/80 mt-1">
                  Disposition provisoire — en attente de validation contre la notice officielle.
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
