import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dicePipTexture } from "./textures";
import { FACE_ORDER, restFor } from "./diceFaces";
import { roundedBoxGeometry } from "./roundedBox";
import { sharedEnvMap } from "./environment";

const DIE_SIZE = 1.1;

/**
 * Dé 3D : pas de moteur physique, une trajectoire scriptée (arc + rotation
 * amortie + rebond) donne la sensation de poids pour une fraction du coût.
 */
function Die({
  value,
  rolling,
  seed,
  home,
}: {
  value: number;
  rolling: boolean;
  seed: number;
  home: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const spin = useRef(new THREE.Vector3());
  const homeVec = useMemo(() => new THREE.Vector3(...home), [home]);

  const gl = useThree((s) => s.gl);
  const materials = useMemo(
    () =>
      FACE_ORDER.map(
        (v) =>
          new THREE.MeshPhysicalMaterial({
            map: dicePipTexture(v),
            roughness: 0.25,
            metalness: 0,
            clearcoat: 0.8,
            clearcoatRoughness: 0.15,
            envMap: sharedEnvMap(gl),
            envMapIntensity: 0.5,
          }),
      ),
    [gl],
  );

  const geometry = useMemo(() => roundedBoxGeometry(DIE_SIZE, DIE_SIZE * 0.17, 5), []);

  useEffect(() => {
    t.current = 0;
    spin.current.set(
      6 + Math.sin(seed * 12.9898) * 5,
      7 + Math.cos(seed * 78.233) * 5,
      5 + Math.sin(seed * 39.425) * 4,
    );
  }, [seed, rolling]);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    t.current += dt;

    if (rolling) {
      const p = t.current;
      const bounce = Math.abs(Math.sin(p * 6.4)) * Math.max(0, 1 - p * 1.05);
      m.position.set(
        home[0] + Math.sin(p * 3.1 + seed) * 0.6,
        home[1] + 2 * Math.max(0, 1 - p * 1.1) + bounce * 1,
        home[2] + Math.cos(p * 2.7 + seed) * 0.6,
      );
      m.rotation.x += spin.current.x * dt;
      m.rotation.y += spin.current.y * dt;
      m.rotation.z += spin.current.z * dt;
      return;
    }

    const [rx, ry, rz] = restFor(value);
    const k = 1 - Math.pow(0.00002, dt);
    m.rotation.x += (rx - m.rotation.x) * k;
    m.rotation.y += (ry - m.rotation.y) * k;
    m.rotation.z += (rz - m.rotation.z) * k;
    m.position.lerp(homeVec, k);
  });

  return <mesh ref={ref} castShadow receiveShadow material={materials} geometry={geometry} position={home} />;
}

export function Dice({
  values,
  rolling,
  rollKey,
  at,
}: {
  values: [number, number];
  rolling: boolean;
  rollKey: number;
  at: [number, number, number];
}) {
  return (
    <group position={[at[0], 0.5, at[2]]}>
      <Die value={values[0]} rolling={rolling} seed={rollKey} home={[-0.85, 0.3, 0]} />
      <Die value={values[1]} rolling={rolling} seed={rollKey + 0.5} home={[0.85, 0.3, 0]} />
    </group>
  );
}
