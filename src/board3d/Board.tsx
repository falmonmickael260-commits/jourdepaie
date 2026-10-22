import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getBoard3DLayout, GEO } from "./layout";
import { tileTexture } from "./textures";
import { roundedBoxGeometryXYZ } from "./roundedBox";
import type { TileDefinition } from "@/game/rules/types";

/** Une case en relief : socle + plaque texturée sur le dessus. */
function Tile({
  tile,
  pos,
  size,
  height,
  onSelect,
}: {
  tile: TileDefinition;
  pos: [number, number, number];
  size: number;
  height: number;
  onSelect?: (tile: TileDefinition) => void;
}) {
  const geometry = useMemo(
    () => roundedBoxGeometryXYZ(size, height, size, Math.min(0.1, size * 0.08), 3),
    [size, height],
  );
  const texture = useMemo(() => tileTexture(tile.type, tile.index), [tile.type, tile.index]);

  return (
    <group position={pos}>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(tile);
        }}
      >
        <meshStandardMaterial color="#e4d3ac" roughness={0.82} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, height + 0.012, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(tile);
        }}
      >
        <planeGeometry args={[size * 0.92, size * 0.92]} />
        <meshStandardMaterial map={texture} roughness={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Board({
  board,
  onSelectTile,
}: {
  board: TileDefinition[];
  onSelectTile?: (tile: TileDefinition) => void;
}) {
  const layout = useMemo(() => getBoard3DLayout(board.length), [board.length]);
  const { x: mx, z: mz, width: mw, depth: md } = layout.medallion;

  return (
    <group>
      {/* Socle : épaisseur et ombre d'ensemble. */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[21, 0.5, 21]} />
        <meshStandardMaterial color="#162031" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.76, 0]}>
        <boxGeometry args={[21.8, 0.14, 21.8]} />
        <meshStandardMaterial color="#D4AF7A" emissive="#D4AF7A" emissiveIntensity={0.35} roughness={0.45} />
      </mesh>

      {/* Tapis entre les cases. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f4ecd8" roughness={0.9} />
      </mesh>

      {board.map((tile, i) => {
        const placement = layout.placements[i];
        if (!placement) return null;
        const size = placement.isTurn ? layout.cornerSize : layout.tileSize;
        return (
          <Tile
            key={tile.id}
            tile={tile}
            pos={placement.pos}
            size={size}
            height={placement.isTurn ? GEO.thickness * 1.5 : GEO.thickness}
            onSelect={onSelectTile}
          />
        );
      })}

      {/* Médaillon central, en losange comme la version 2D. */}
      <group position={[mx, 0, mz]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <boxGeometry args={[mw * 0.82, 0.6, md * 0.82]} />
          <meshStandardMaterial color="#16594a" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[mw * 0.84, 0.03, md * 0.84]} />
          <meshStandardMaterial color="#d4af7a" emissive="#d4af7a" emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** Halo pulsant sous la case où le joueur actif se trouve. */
export function ActiveTileHalo({ board, tileIndex }: { board: TileDefinition[]; tileIndex: number | null }) {
  const layout = useMemo(() => getBoard3DLayout(board.length), [board.length]);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((st) => {
    const m = mesh.current;
    if (!m) return;
    const pulse = 0.5 + 0.5 * Math.sin(st.clock.elapsedTime * 3.2);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.15 + pulse * 0.25;
  });

  if (tileIndex === null) return null;
  const placement = layout.placements[tileIndex];
  if (!placement) return null;
  const size = placement.isTurn ? layout.cornerSize : layout.tileSize;
  const height = placement.isTurn ? GEO.thickness * 1.5 : GEO.thickness;

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[placement.pos[0], height + 0.02, placement.pos[2]]}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color="#EAB308" transparent opacity={0.25} toneMapped={false} />
    </mesh>
  );
}
