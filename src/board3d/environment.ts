import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Carte d'environnement partagée pour les matériaux métalliques (pions, dés).
 *
 * Un métal n'a presque pas de couleur propre : ce qu'on en voit est le
 * reflet de ce qui l'entoure, teinté. Sans environnement, un matériau à
 * forte `metalness` reste quasiment noir. Plutôt que de charger une sonde
 * HDR externe, on génère une pièce procédurale fournie par three — aucun
 * fichier à héberger, un rendu plus modeste mais jamais un plateau qui reste
 * bloqué en attendant un asset.
 */
let cache: THREE.Texture | null = null;

export const sharedEnvMap = (gl: THREE.WebGLRenderer): THREE.Texture => {
  if (cache) return cache;
  const pmrem = new THREE.PMREMGenerator(gl);
  const room = new RoomEnvironment();
  const target = pmrem.fromScene(room, 0.04);
  room.dispose();
  pmrem.dispose();
  cache = target.texture;
  return cache;
};
