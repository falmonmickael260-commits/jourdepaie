/**
 * Conversion de la géométrie 2D du plateau (`data/board-geometry.ts`, en
 * pourcentages d'écran) vers des coordonnées monde pour le rendu 3D. La
 * spirale, l'ordre des cases et le médaillon central restent calculés une
 * seule fois, côté 2D : ce module ne fait que les replacer dans l'espace.
 */

import { computeSpiralLayout, tokenOffset } from "@/data/board-geometry";

/** Étendue totale du plateau en unités monde (le plateau fait BOARD_WORLD_SIZE x BOARD_WORLD_SIZE). */
export const BOARD_WORLD_SIZE = 20;

/** Un delta en pourcentage d'écran converti en delta d'unités monde. */
const pctDeltaToWorld = (deltaPct: number) => (deltaPct / 100) * BOARD_WORLD_SIZE;
const pctToWorld = (pct: number) => pctDeltaToWorld(pct - 50);

export interface Placement3D {
  index: number;
  pos: [number, number, number];
  isTurn: boolean;
}

export interface Board3DLayout {
  placements: Placement3D[];
  /** Empreinte au sol d'une case ordinaire. */
  tileSize: number;
  /** Empreinte au sol d'une case d'angle (plus grande, comme en 2D). */
  cornerSize: number;
  medallion: { x: number; z: number; width: number; depth: number };
}

const cache = new Map<number, Board3DLayout>();

export function getBoard3DLayout(total: number): Board3DLayout {
  const cached = cache.get(total);
  if (cached) return cached;

  const { tiles, hubBounds } = computeSpiralLayout(total);

  // Deux cases consécutives du premier segment partagent la même rangée :
  // l'écart entre elles donne l'espacement de la grille, sans dupliquer la
  // marge interne de `computeSpiralLayout`.
  const spacingPct =
    tiles.length > 1
      ? Math.hypot(tiles[1].xPct - tiles[0].xPct, tiles[1].yPct - tiles[0].yPct)
      : 16;
  const spacingWorld = pctDeltaToWorld(spacingPct);

  const placements: Placement3D[] = tiles.map((t) => ({
    index: t.index,
    isTurn: t.isTurn,
    pos: [pctToWorld(t.xPct), 0, pctToWorld(t.yPct)],
  }));

  const result: Board3DLayout = {
    placements,
    tileSize: spacingWorld * 0.8,
    cornerSize: spacingWorld * 0.95,
    medallion: {
      x: pctToWorld(hubBounds.xPct + hubBounds.wPct / 2),
      z: pctToWorld(hubBounds.yPct + hubBounds.hPct / 2),
      width: pctDeltaToWorld(hubBounds.wPct),
      depth: pctDeltaToWorld(hubBounds.hPct),
    },
  };
  cache.set(total, result);
  return result;
}

export const GEO = {
  thickness: 0.46,
  baseExtra: 0.9,
};

/** Emplacement monde d'un pion sur sa case, décalé s'il en partage une avec d'autres. */
export function tokenWorldPosition(
  layout: Board3DLayout,
  tileIndex: number,
  slot: number,
  total: number,
): [number, number, number] {
  const p = layout.placements[tileIndex]?.pos ?? [0, 0, 0];
  const { dx, dy } = tokenOffset(slot, total);
  return [p[0] + pctDeltaToWorld(dx), GEO.thickness / 2, p[2] + pctDeltaToWorld(dy)];
}
