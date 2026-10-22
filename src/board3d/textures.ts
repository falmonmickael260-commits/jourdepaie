import * as THREE from "three";
import type { TileType } from "@/game/rules/types";

/**
 * Textures procédurales (canvas → `CanvasTexture`), mises en cache : aucune
 * image binaire à charger, cohérent avec le reste du projet (voir
 * `src/lib/audio/sfx-engine.ts`, synthétisé de la même façon).
 */

let anisotropy = 1;
export const setMaxAnisotropy = (value: number) => {
  anisotropy = value;
};

function finalize(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/** Teinte dominante par type de case — aide à repérer un type d'un coup d'œil vu de haut. */
export const TILE_COLORS: Record<TileType, { base: string; accent: string; icon: string }> = {
  depart: { base: "#5f9e80", accent: "#0a2f24", icon: "#fdfaf1" },
  paie: { base: "#e3bd73", accent: "#5c3d1a", icon: "#3d2c14" },
  dimanche: { base: "#d3d8d6", accent: "#3c4642", icon: "#3c4642" },
  courrier: { base: "#f0e4c6", accent: "#95582e", icon: "#8f6c3b" },
  acquisition: { base: "#c3e0d1", accent: "#16594a", icon: "#16594a" },
  vendez: { base: "#e3c89b", accent: "#95582e", icon: "#7a4524" },
  evenement: { base: "#edca7e", accent: "#8f6c3b", icon: "#5c3d1a" },
  loterie: { base: "#ecd698", accent: "#b38a52", icon: "#8f6c3b" },
  anniversaire: { base: "#f0e4c6", accent: "#d4af7a", icon: "#95582e" },
  cotisation: { base: "#c3e0d1", accent: "#2b8f78", icon: "#146356" },
  cagnotte: { base: "#fbefc7", accent: "#a9772e", icon: "#5c3d1a" },
  "changement-heure": { base: "#e3c89b", accent: "#5b6c8f", icon: "#2e3a52" },
};

const tileCache = new Map<string, THREE.CanvasTexture>();

/** Dessine le glyphe d'un type de case, simplifié pour rester lisible à petite taille. */
function drawGlyph(ctx: CanvasRenderingContext2D, type: TileType, size: number, color: string) {
  const c = size / 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (type) {
    case "depart": {
      ctx.beginPath();
      ctx.moveTo(c - size * 0.12, c - size * 0.22);
      ctx.lineTo(c - size * 0.12, c + size * 0.24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c - size * 0.12, c - size * 0.2);
      ctx.lineTo(c + size * 0.2, c - size * 0.12);
      ctx.lineTo(c - size * 0.12, c - size * 0.04);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "paie": {
      ctx.beginPath();
      ctx.roundRect(c - size * 0.26, c - size * 0.16, size * 0.52, size * 0.32, size * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c, c, size * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "dimanche": {
      ctx.beginPath();
      ctx.arc(c + size * 0.05, c, size * 0.2, Math.PI * 0.2, Math.PI * 1.9, false);
      ctx.stroke();
      break;
    }
    case "courrier": {
      ctx.beginPath();
      ctx.roundRect(c - size * 0.26, c - size * 0.18, size * 0.52, size * 0.36, size * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c - size * 0.26, c - size * 0.18);
      ctx.lineTo(c, c + size * 0.05);
      ctx.lineTo(c + size * 0.26, c - size * 0.18);
      ctx.stroke();
      break;
    }
    case "acquisition": {
      ctx.beginPath();
      ctx.moveTo(c - size * 0.2, c - size * 0.08);
      ctx.lineTo(c - size * 0.24, c + size * 0.24);
      ctx.lineTo(c + size * 0.24, c + size * 0.24);
      ctx.lineTo(c + size * 0.2, c - size * 0.08);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c, c - size * 0.1, size * 0.1, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case "vendez": {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-size * 0.22, -size * 0.1);
      ctx.lineTo(size * 0.1, -size * 0.1);
      ctx.lineTo(size * 0.22, 0);
      ctx.lineTo(size * 0.1, size * 0.1);
      ctx.lineTo(-size * 0.22, size * 0.1);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-size * 0.1, 0, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "evenement": {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 8;
        const r1 = size * 0.08;
        const r2 = size * 0.22;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
        ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(c, c, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "loterie": {
      ctx.beginPath();
      ctx.roundRect(c - size * 0.2, c - size * 0.2, size * 0.4, size * 0.4, size * 0.06);
      ctx.stroke();
      const pips: [number, number][] = [
        [-0.09, -0.09],
        [0.09, 0.09],
        [0, 0],
      ];
      for (const [px, py] of pips) {
        ctx.beginPath();
        ctx.arc(c + px * size, c + py * size, size * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "anniversaire": {
      ctx.beginPath();
      ctx.roundRect(c - size * 0.2, c - size * 0.05, size * 0.4, size * 0.3, size * 0.03);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c - size * 0.2, c - size * 0.05);
      ctx.lineTo(c + size * 0.2, c - size * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c, c - size * 0.05);
      ctx.lineTo(c, c - size * 0.22);
      ctx.stroke();
      break;
    }
    case "cotisation": {
      ctx.beginPath();
      ctx.arc(c - size * 0.16, c + size * 0.12, size * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c + size * 0.16, c + size * 0.12, size * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c - size * 0.16, c + size * 0.12);
      ctx.lineTo(c - size * 0.02, c - size * 0.14);
      ctx.lineTo(c + size * 0.16, c + size * 0.12);
      ctx.lineTo(c + size * 0.02, c + size * 0.12);
      ctx.lineTo(c - size * 0.1, c - size * 0.05);
      ctx.stroke();
      break;
    }
    case "cagnotte": {
      for (const dy of [-0.08, 0, 0.08]) {
        ctx.beginPath();
        ctx.ellipse(c, c + dy * size, size * 0.18, size * 0.07, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "changement-heure": {
      ctx.beginPath();
      ctx.arc(c, c, size * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c, c - size * 0.14);
      ctx.moveTo(c, c);
      ctx.lineTo(c + size * 0.1, c + size * 0.04);
      ctx.stroke();
      break;
    }
  }
}

/** Cases dont la case affiche un libellé ("Départ" / "Paie") plutôt qu'un numéro. */
const MILESTONE_TYPES: TileType[] = ["depart", "paie"];

/** Texture d'une case, mise en cache par (type, numéro, taille demandée en pixels). */
export function tileTexture(type: TileType, index: number, px = 192): THREE.CanvasTexture {
  const key = `${type}:${index}:${px}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  const { base, accent, icon } = TILE_COLORS[type];

  const grad = ctx.createLinearGradient(0, 0, px, px);
  grad.addColorStop(0, "#fdfaf1");
  grad.addColorStop(0.45, base);
  grad.addColorStop(1, accent);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, px, px);

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = px * 0.035;
  ctx.strokeRect(px * 0.03, px * 0.03, px * 0.94, px * 0.94);
  ctx.globalAlpha = 1;

  if (!MILESTONE_TYPES.includes(type)) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${Math.round(px * 0.16)}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(String(index), px * 0.92, px * 0.06);
  }

  drawGlyph(ctx, type, px, icon);

  const tex = finalize(canvas);
  tileCache.set(key, tex);
  return tex;
}

/** Disposition des pastilles d'un dé, grille 3x3 — identique au dé 2D (`Die.tsx`). */
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

const diceCache = new Map<number, THREE.CanvasTexture>();

/** Texture d'une face de dé (valeur 1 à 6), mise en cache. */
export function dicePipTexture(value: number, px = 256): THREE.CanvasTexture {
  const cached = diceCache.get(value);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fdfbf4";
  ctx.beginPath();
  ctx.roundRect(0, 0, px, px, px * 0.14);
  ctx.fill();

  ctx.fillStyle = value === 1 ? "#a9372f" : "#1a2436";
  const cell = px / 3;
  const r = px * 0.075;
  for (const [row, col] of PIP_LAYOUTS[value] ?? []) {
    ctx.beginPath();
    ctx.arc(cell * col + cell / 2, cell * row + cell / 2, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = finalize(canvas);
  diceCache.set(value, tex);
  return tex;
}
