import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BOARD_WORLD_SIZE } from "./layout";
import { REDUCED_MOTION } from "./renderProfile";

const HALF = BOARD_WORLD_SIZE / 2;

/**
 * Caméra de la table : immobile au repos, cadrage mesuré par projection des
 * coins du plateau plutôt qu'estimé — un plateau vu de biais projette son
 * bord proche plus large que son bord lointain.
 */
export function FollowCamera({
  compact,
  follow,
}: {
  compact: boolean;
  /** Point monde actuellement suivi, ou `null` pour la vue d'ensemble. */
  follow: [number, number, number] | null;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const vise = useRef(new THREE.Vector3(0, 0, 0));
  const posCourante = useRef(new THREE.Vector3());
  const initialise = useRef(false);
  const desiree = useMemo(() => new THREE.Vector3(), []);
  const cible = useMemo(() => new THREE.Vector3(), []);

  // Le FOV / near / far réels sont fixés par le prop `camera` du Canvas
  // (voir `Scene.tsx`) ; R3F les tient à jour sur la vraie caméra lui-même.
  // On ne les lit jamais ici pour ne pas avoir à écrire dans l'objet rendu
  // par `useThree`, que la nouvelle règle de lint traite comme immuable.
  const repos = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = compact ? 48 : 34;

    const tilt = compact ? 1.2 : 1.15;
    const aimY = 0;

    const coins: THREE.Vector3[] = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        coins.push(new THREE.Vector3(sx * HALF, 0, sz * HALF));
        coins.push(new THREE.Vector3(sx * HALF, 1.6, sz * HALF));
      }
    }

    const utileX = compact ? 0.98 : 0.92;
    const utileY = compact ? 0.72 : 0.86;

    const sonde = new THREE.PerspectiveCamera(fov, aspect, 5, 200);
    let dist = HALF * 3;
    for (let i = 0; i < 5; i++) {
      sonde.position.set(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist);
      sonde.lookAt(0, aimY, 0);
      sonde.updateMatrixWorld();
      sonde.updateProjectionMatrix();
      let debord = 0;
      for (const p of coins) {
        const ndc = p.clone().project(sonde);
        debord = Math.max(debord, Math.abs(ndc.x) / utileX, Math.abs(ndc.y) / utileY);
      }
      if (Math.abs(debord - 1) < 0.005) break;
      dist *= debord;
    }

    return { dist, tilt, aimY };
  }, [size.width, size.height, compact]);

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const suit = follow !== null && !REDUCED_MOTION && !compact;

    if (suit && follow) {
      cible.set(follow[0] * 0.4, repos.aimY, follow[2] * 0.4);
    } else {
      cible.set(0, repos.aimY, 0);
    }

    const dist = suit ? repos.dist * 0.88 : repos.dist;

    desiree.set(cible.x, Math.sin(repos.tilt) * dist, cible.z + Math.cos(repos.tilt) * dist);

    if (!initialise.current) {
      posCourante.current.copy(desiree);
      vise.current.copy(cible);
      initialise.current = true;
    } else {
      const k = 1 - Math.pow(0.035, dt);
      posCourante.current.lerp(desiree, k);
      vise.current.lerp(cible, k);
    }

    cam.position.copy(posCourante.current);
    cam.lookAt(vise.current);
  });

  return null;
}
