"use client";

import { useEffect, useMemo, useState } from "react";
import { Scene, type DiceCinema } from "@/board3d/Scene";
import { getBoard3DLayout, tokenWorldPosition } from "@/board3d/layout";
import { useTokenSequencer } from "@/board3d/useTokenSequencer";
import type { PlayerState } from "@/game/engine/types";
import type { TileDefinition } from "@/game/rules/types";

function useIsCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

/**
 * Fait avancer un pion case par case et reporte sa position monde courante
 * au parent. Ne rend rien lui-même : toute la représentation 3D vit dans
 * `Scene`, qui ne connaît que des positions.
 */
function TokenDriver({
  player,
  boardLength,
  slot,
  total,
  onPosition,
  onArrived,
}: {
  player: PlayerState;
  boardLength: number;
  slot: number;
  total: number;
  onPosition: (id: string, pos: [number, number, number]) => void;
  onArrived: (playerId: string, finalTile: number) => void;
}) {
  const layout = useMemo(() => getBoard3DLayout(boardLength), [boardLength]);

  const displayTile = useTokenSequencer(player.position, boardLength, {
    onArrived: () => onArrived(player.id, player.position),
  });

  useEffect(() => {
    onPosition(player.id, tokenWorldPosition(layout, displayTile, slot, total));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayTile, layout, slot, total]);

  return null;
}

export function GameBoard3D({
  board,
  players,
  activePlayerIndex,
  phase,
  lastRoll,
  isRolling,
  onMoveAnimationComplete,
  onPayday,
  onSelectTile,
}: {
  board: TileDefinition[];
  players: PlayerState[];
  activePlayerIndex: number;
  phase: string;
  lastRoll: [number, number] | null;
  isRolling: boolean;
  onMoveAnimationComplete: () => void;
  onPayday: () => void;
  onSelectTile?: (tile: TileDefinition) => void;
}) {
  const compact = useIsCompact();
  const [positions, setPositions] = useState<Record<string, [number, number, number]>>({});

  // Nouveau lancer détecté pendant le rendu plutôt que dans un effet : évite
  // un aller-retour de rendu supplémentaire pour une simple graine d'anim.
  const [wasRolling, setWasRolling] = useState(isRolling);
  const [rollKey, setRollKey] = useState(0);
  if (isRolling !== wasRolling) {
    setWasRolling(isRolling);
    if (isRolling) setRollKey((k) => k + 1);
  }

  const tilesByPosition = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const p of players) {
      const list = map.get(p.position) ?? [];
      list.push(p.id);
      map.set(p.position, list);
    }
    return map;
  }, [players]);

  const activePlayer = players[activePlayerIndex] ?? null;

  const handlePosition = (id: string, pos: [number, number, number]) => {
    setPositions((prev) => {
      const current = prev[id];
      if (current && current[0] === pos[0] && current[1] === pos[1] && current[2] === pos[2]) return prev;
      return { ...prev, [id]: pos };
    });
  };

  const handleArrived = (playerId: string, finalTile: number) => {
    if (playerId !== activePlayer?.id) return;
    if (board[finalTile]?.type === "paie") onPayday();
    if (phase === "moving") onMoveAnimationComplete();
  };

  const dice: DiceCinema | null = lastRoll ? { values: lastRoll, rolling: isRolling, key: rollKey } : null;
  const followPos = phase === "moving" && activePlayer ? positions[activePlayer.id] ?? null : null;

  return (
    <>
      {players.map((p) => {
        const occupants = tilesByPosition.get(p.position) ?? [p.id];
        const slot = Math.max(0, occupants.indexOf(p.id));
        return (
          <TokenDriver
            key={p.id}
            player={p}
            boardLength={board.length}
            slot={slot}
            total={occupants.length}
            onPosition={handlePosition}
            onArrived={handleArrived}
          />
        );
      })}
      <Scene
        board={board}
        players={players.map((p) => ({ id: p.id, tokenId: p.tokenId, connected: p.connected }))}
        positions={positions}
        activePlayerId={activePlayer?.id ?? null}
        activeTileIndex={activePlayer?.position ?? null}
        dice={dice}
        followPos={followPos}
        compact={compact}
        onSelectTile={onSelectTile}
      />
    </>
  );
}
