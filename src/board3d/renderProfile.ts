/**
 * Profil de rendu, décidé une seule fois au chargement du module : pas de
 * mesure de cadence en cours de partie qui dégraderait la définition sous
 * les yeux du joueur.
 */

const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
const reduced =
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const dpr = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;

/**
 * Densité d'affichage par budget de pixels plutôt que par plafond fixe : la
 * netteté suit la taille de fenêtre et la cadence reste tenable partout.
 */
const surfaceCss =
  typeof window !== "undefined" ? Math.max(1, window.innerWidth * window.innerHeight) : 1e6;
const BUDGET_PIXELS = coarse ? 2_000_000 : 6_000_000;
export const RENDER_DPR = Math.max(1, Math.min(dpr, 2, Math.sqrt(BUDGET_PIXELS / surfaceCss)));

/** Ombres portées : gardées sur pointeur fin, désactivées sur tactile / mouvement réduit. */
export const RENDER_SHADOWS: boolean = !(coarse || reduced);
export const SHADOW_MAP = 1024;

export const IS_TOUCH = coarse;
export const REDUCED_MOTION = reduced;
