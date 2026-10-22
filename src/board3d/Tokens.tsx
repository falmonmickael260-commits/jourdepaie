import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TOKEN_COLORS } from "@/game/tokenPalette";
import { sharedEnvMap } from "./environment";
import type { PlayerTokenId } from "@/game/engine/types";

/** Socle tourné commun à tous les pions (rayon x hauteur, révolu autour de l'axe). */
const PROFIL_SOCLE: THREE.Vector2[] = (
  [
    [0, 0],
    [0.19, 0],
    [0.205, 0.015],
    [0.2, 0.036],
    [0.16, 0.05],
    [0.1, 0.066],
    [0, 0.07],
  ] as [number, number][]
).map(([x, y]) => new THREE.Vector2(x, y));

const H_SOCLE = 0.07;

/**
 * Silhouettes de pions — chacune reste identifiable vue du dessus, la caméra
 * regardant la table de haut : une forme purement tournée s'y résumerait à
 * un simple cercle.
 */
function Shape({ token, mat }: { token: PlayerTokenId; mat: THREE.Material }) {
  switch (token) {
    case "piece-or": // Pièce : disque épais, tranche crantée, empreinte en relief
      return (
        <group position={[0, H_SOCLE + 0.04, 0]}>
          <mesh castShadow material={mat}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 24]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, 0.045, 0]}>
            <torusGeometry args={[0.13, 0.025, 8, 20]} />
          </mesh>
        </group>
      );
    case "porte-monnaie": // Porte-monnaie : pochette renflée, fermoir en boule
      return (
        <group position={[0, H_SOCLE, 0]}>
          <mesh castShadow material={mat} position={[0, 0.1, 0]} scale={[1, 0.85, 0.62]}>
            <sphereGeometry args={[0.2, 16, 12]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.045, 10, 8]} />
          </mesh>
        </group>
      );
    case "cle": // Clé : anneau (panneton) debout, tige, dent latérale
      return (
        <group position={[0, H_SOCLE + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow material={mat} position={[0, 0.18, 0]}>
            <torusGeometry args={[0.1, 0.038, 10, 20]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
          </mesh>
          <mesh castShadow material={mat} position={[0.045, -0.14, 0]}>
            <boxGeometry args={[0.09, 0.05, 0.03]} />
          </mesh>
        </group>
      );
    case "horloge": // Horloge : fût cylindrique, deux aiguilles saillantes
      return (
        <group position={[0, H_SOCLE, 0]}>
          <mesh castShadow material={mat} position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.26, 20]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, 0.275, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.02, 20]} />
          </mesh>
          <mesh castShadow material={mat} position={[0.06, 0.29, 0.02]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.16, 0.02, 0.02]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, 0.29, 0.07]} rotation={[-0.9, 0, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.12]} />
          </mesh>
        </group>
      );
    case "valise": // Valise : coffre rectangulaire, poignée en arceau
      return (
        <group position={[0, H_SOCLE, 0]}>
          <mesh castShadow material={mat} position={[0, 0.11, 0]}>
            <boxGeometry args={[0.38, 0.22, 0.17]} />
          </mesh>
          <mesh castShadow material={mat} position={[0, 0.11, 0]}>
            <boxGeometry args={[0.02, 0.24, 0.19]} />
          </mesh>
          <mesh castShadow material={mat} rotation={[0, 0, Math.PI / 2.4]} position={[0, 0.27, 0]}>
            <torusGeometry args={[0.07, 0.016, 8, 14, Math.PI]} />
          </mesh>
        </group>
      );
    default: // Trèfle : quatre lobes en croix autour d'une tige
      return (
        <group position={[0, H_SOCLE, 0]}>
          <mesh castShadow material={mat} position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.16, 8]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={i}
                castShadow
                material={mat}
                position={[Math.cos(a) * 0.1, 0.17, Math.sin(a) * 0.1]}
              >
                <sphereGeometry args={[0.1, 14, 12]} />
              </mesh>
            );
          })}
        </group>
      );
  }
}

const PAWN_SCALE = 1.5;

const dureeBond = (d: number) => Math.min(0.4, Math.max(0.1, d * 0.09));
const hauteurBond = (d: number) => Math.min(1.1, 0.25 + d * 0.22);

function Pawn({
  token,
  target,
  active,
  bankrupt,
  id,
}: {
  token: PlayerTokenId;
  target: [number, number, number];
  active: boolean;
  bankrupt: boolean;
  id: string;
}) {
  const g = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(...target));
  const vec = useMemo(() => new THREE.Vector3(), []);
  const depart = useRef(new THREE.Vector3(...target));
  const arrivee = useRef(new THREE.Vector3(...target));
  const avance = useRef(1);
  const duree = useRef(0.15);
  const haut = useRef(0);
  const choc = useRef(0);
  const rotCible = useRef(0);
  const echelle = useRef(0.001);
  const onde = useRef<THREE.Mesh>(null);

  const color = TOKEN_COLORS[token].mid;
  const matOnde = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [color],
  );
  const gl = useThree((s) => s.gl);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.75,
        roughness: 0.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        envMap: sharedEnvMap(gl),
        envMapIntensity: 1.1,
      }),
    [color, gl],
  );

  useLayoutEffect(() => {
    if (!g.current) return;
    g.current.position.set(...target);
    const s = bankrupt ? 0.001 : PAWN_SCALE;
    g.current.scale.setScalar(s);
    echelle.current = s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((st, dt) => {
    if (!g.current) return;
    vec.set(...target);

    if (!arrivee.current.equals(vec)) {
      depart.current.copy(pos.current);
      arrivee.current.copy(vec);
      const d = depart.current.distanceTo(vec);
      duree.current = dureeBond(d);
      haut.current = hauteurBond(d);
      avance.current = 0;
      rotCible.current += Math.PI;
    }

    let saut = 0;
    let etire = 1;
    if (avance.current < 1) {
      const precedent = avance.current;
      avance.current = Math.min(1, avance.current + dt / duree.current);
      const u = avance.current;
      pos.current.lerpVectors(depart.current, arrivee.current, u * u * (3 - 2 * u));
      saut = 4 * u * (1 - u) * haut.current;
      etire = 1 + Math.sin(Math.PI * u) * 0.18;
      if (precedent < 1 && u >= 1) choc.current = 1;
    } else {
      pos.current.copy(arrivee.current);
    }

    if (choc.current > 0) {
      choc.current = Math.max(0, choc.current - dt * 4.5);
      etire *= 1 - choc.current * 0.26;
    }

    const bob = active && avance.current >= 1 ? Math.sin(st.clock.elapsedTime * 2.6) * 0.03 : 0;
    g.current.position.set(pos.current.x, pos.current.y + saut + bob, pos.current.z);

    if (active && avance.current >= 1) rotCible.current += dt * 0.5;
    g.current.rotation.y += (rotCible.current - g.current.rotation.y) * (1 - Math.pow(0.004, dt));

    const s = (echelle.current += ((bankrupt ? 0.001 : PAWN_SCALE) - echelle.current) * (1 - Math.pow(0.02, dt)));
    const lat = s / Math.sqrt(etire);
    g.current.scale.set(lat, s * etire, lat);

    if (onde.current) {
      const visible = choc.current > 0.01 && !bankrupt;
      onde.current.visible = visible;
      if (visible) {
        onde.current.scale.setScalar(0.6 + (1 - choc.current) * 1.1);
        (onde.current.material as THREE.MeshBasicMaterial).opacity = choc.current * 0.5;
      }
    }
  });

  return (
    <group ref={g} name={`pion-${id}`}>
      <mesh castShadow receiveShadow material={mat}>
        <latheGeometry args={[PROFIL_SOCLE, 24]} />
      </mesh>
      <Shape token={token} mat={mat} />
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.26, 0.33, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} toneMapped={false} />
        </mesh>
      )}
      <mesh ref={onde} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} material={matOnde} visible={false}>
        <ringGeometry args={[0.18, 0.26, 24]} />
      </mesh>
    </group>
  );
}

export function Tokens({
  players,
  positions,
  activePlayerId,
}: {
  players: { id: string; tokenId: PlayerTokenId; connected: boolean }[];
  /** Position monde affichée pour chaque joueur (distincte de sa position logique pendant un déplacement). */
  positions: Record<string, [number, number, number]>;
  activePlayerId: string | null;
}) {
  return (
    <group>
      {players.map((p) => (
        <Pawn
          key={p.id}
          id={p.id}
          token={p.tokenId}
          target={positions[p.id] ?? [0, 0, 0]}
          active={activePlayerId === p.id}
          bankrupt={false}
        />
      ))}
    </group>
  );
}
