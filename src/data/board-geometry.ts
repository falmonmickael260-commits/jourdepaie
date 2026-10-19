/**
 * Géométrie du plateau — spirale carrée se resserrant vers un médaillon
 * central, à l'image de la structure mécanique d'un vrai plateau physique
 * (parcours qui s'enroule vers l'intérieur plutôt qu'une simple boucle de
 * périmètre). Composition et habillage entièrement ORIGINAUX — seule la
 * LOGIQUE DE PARCOURS (spirale, case de départ en angle extérieur, case de
 * fin de parcours au centre) s'inspire de la disposition d'ensemble observée
 * sur un plateau physique de référence.
 */

const MARGIN = 9.5;

export interface SpiralTile {
  index: number;
  row: number;
  col: number;
  xPct: number;
  yPct: number;
  /** Point d'angle du parcours (début de segment) — mis en valeur visuellement. */
  isTurn: boolean;
}

export interface HubBounds {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export interface SpiralLayout {
  tiles: SpiralTile[];
  gridSize: number;
  hubBounds: HubBounds;
}

function cellToPct(row: number, col: number, n: number) {
  const span = 100 - 2 * MARGIN;
  return {
    xPct: MARGIN + (col / (n - 1)) * span,
    yPct: MARGIN + (row / (n - 1)) * span,
  };
}

/**
 * Génère un parcours en spirale carrée inversée (de l'extérieur vers le
 * centre) sur une grille `gridSize` x `gridSize`, en s'arrêtant après `total`
 * cases. Avec `total = 32` et `gridSize = 6`, les deux anneaux se remplissent
 * exactement (20 + 12 cases) et laissent un bloc central 2x2 libre pour le
 * médaillon — une coïncidence géométrique exploitée plutôt qu'un hasard.
 */
export function computeSpiralLayout(total: number, gridSize = 6): SpiralLayout {
  const n = gridSize;
  const visited: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const order: { row: number; col: number; isTurn: boolean }[] = [];
  let top = 0,
    bottom = n - 1,
    left = 0,
    right = n - 1;

  outer: while (top <= bottom && left <= right) {
    for (let c = right; c >= left; c--) {
      order.push({ row: bottom, col: c, isTurn: c === right });
      if (order.length >= total) break outer;
    }
    bottom--;
    for (let r = bottom; r >= top; r--) {
      order.push({ row: r, col: left, isTurn: r === bottom });
      if (order.length >= total) break outer;
    }
    left++;
    for (let c = left; c <= right; c++) {
      order.push({ row: top, col: c, isTurn: c === left });
      if (order.length >= total) break outer;
    }
    top++;
    for (let r = top; r <= bottom; r++) {
      order.push({ row: r, col: right, isTurn: r === top });
      if (order.length >= total) break outer;
    }
    right--;
  }

  order.forEach((o) => {
    visited[o.row][o.col] = true;
  });

  const tiles: SpiralTile[] = order.map((o, index) => ({
    index,
    row: o.row,
    col: o.col,
    isTurn: o.isTurn,
    ...cellToPct(o.row, o.col, n),
  }));

  const freeCells: { row: number; col: number }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!visited[r][c]) freeCells.push({ row: r, col: c });
    }
  }

  const rows = freeCells.map((h) => h.row);
  const cols = freeCells.map((h) => h.col);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  const p1 = cellToPct(minR, minC, n);
  const p2 = cellToPct(maxR, maxC, n);
  const step = (100 - 2 * MARGIN) / (n - 1);

  const hubBounds: HubBounds = {
    xPct: p1.xPct - step / 2,
    yPct: p1.yPct - step / 2,
    wPct: p2.xPct - p1.xPct + step,
    hPct: p2.yPct - p1.yPct + step,
  };

  return { tiles, gridSize: n, hubBounds };
}

/** Décale légèrement plusieurs pions partageant la même case (petit arc). */
export function tokenOffset(slot: number, total: number): { dx: number; dy: number } {
  if (total <= 1) return { dx: 0, dy: 0 };
  const radius = 2.4;
  const angle = (slot / total) * Math.PI * 2;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}
