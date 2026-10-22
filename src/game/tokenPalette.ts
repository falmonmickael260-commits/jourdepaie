import type { PlayerTokenId } from "./engine/types";

/**
 * Couleur "corps" par pion — les teintes claire/moyenne/sombre en dérivent.
 * Source commune au rendu 2D (`PlayerToken.tsx`) et 3D (`board3d/Tokens.tsx`).
 */
export const TOKEN_COLORS: Record<
  PlayerTokenId,
  { light: string; mid: string; dark: string; darker: string }
> = {
  "piece-or": { light: "#f2e3bd", mid: "#d4af7a", dark: "#9c7340", darker: "#5c3d1a" },
  "porte-monnaie": { light: "#6fc2ac", mid: "#2b8f78", dark: "#146356", darker: "#0a3328" },
  cle: { light: "#d99a67", mid: "#b5713f", dark: "#8f5428", darker: "#5c3414" },
  horloge: { light: "#5b6c8f", mid: "#2e3a52", dark: "#1b253a", darker: "#0a0e1a" },
  valise: { light: "#d17b73", mid: "#a94d47", dark: "#7a2e2e", darker: "#4a1818" },
  trefle: { light: "#c6a25c", mid: "#8f6c3b", dark: "#6b4f26", darker: "#3d2c14" },
};
