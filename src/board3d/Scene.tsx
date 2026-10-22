"use client";

import { Component, Suspense, memo, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Board, ActiveTileHalo } from "./Board";
import { Tokens } from "./Tokens";
import { Dice } from "./Dice";
import { FollowCamera } from "./FollowCamera";
import { RENDER_DPR, RENDER_SHADOWS, SHADOW_MAP } from "./renderProfile";
import { setMaxAnisotropy } from "./textures";
import type { TileDefinition } from "@/game/rules/types";
import type { PlayerTokenId } from "@/game/engine/types";

/**
 * Un contexte WebGL qui échoue à l'initialisation (pilote absent, mémoire
 * GPU épuisée) ne doit jamais bloquer la partie sur un écran noir : on
 * retombe sur un message discret plutôt que de laisser planter toute la page.
 */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Plateau 3D indisponible :", error);
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-ivory-50/70 text-sm font-sans text-center px-6">
          Le plateau en relief n&apos;a pas pu s&apos;afficher sur cet appareil.
        </div>
      );
    }
    return this.props.children;
  }
}

/** Signale à `onFirstFrame` que la boucle de rendu tourne bel et bien. */
function FrameWatchdog({ onFirstFrame }: { onFirstFrame: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onFirstFrame();
  });
  return null;
}

const GL_PROPS = {
  antialias: true,
  powerPreference: "high-performance" as const,
  alpha: false,
  stencil: false,
};
const CANVAS_STYLE = { position: "absolute", inset: 0 } as const;

const Lights = memo(() => (
  <>
    <hemisphereLight args={["#FFF6E6", "#7A6448", 1.4]} />
    <ambientLight intensity={1.1} color="#FFF9EE" />
    <directionalLight
      position={[6, 34, 8]}
      intensity={1.9}
      color="#FFF4DE"
      castShadow
      shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
      shadow-camera-left={-14}
      shadow-camera-right={14}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-bias={-0.0006}
    />
    <directionalLight position={[-14, 12, -10]} intensity={0.7} color="#CFE0FF" />
  </>
));
Lights.displayName = "Lights";

/** Mesure du conteneur avant d'instancier le rendu, comme Atlas Royale : la
 * taille en pixels n'est pas imposée au Canvas, qui se mesure lui-même. */
function useHasSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lire = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setPret(true);
    };
    lire();
    const ro = new ResizeObserver(lire);
    ro.observe(el);
    window.addEventListener("resize", lire);
    document.addEventListener("visibilitychange", lire);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", lire);
      document.removeEventListener("visibilitychange", lire);
    };
  }, []);
  return { ref, pret };
}

export interface DiceCinema {
  values: [number, number];
  rolling: boolean;
  key: number;
}

export function Scene({
  board,
  players,
  positions,
  activePlayerId,
  activeTileIndex,
  dice,
  followPos,
  compact,
  onSelectTile,
}: {
  board: TileDefinition[];
  players: { id: string; tokenId: PlayerTokenId; connected: boolean }[];
  positions: Record<string, [number, number, number]>;
  activePlayerId: string | null;
  /** Case affichée comme "active" (halo doré), indépendante de la position logique pendant un déplacement. */
  activeTileIndex: number | null;
  dice: DiceCinema | null;
  followPos: [number, number, number] | null;
  compact: boolean;
  onSelectTile?: (tile: TileDefinition) => void;
}) {
  const { ref, pret } = useHasSize();
  const camera = { position: [0, 24, 20] as [number, number, number], fov: compact ? 48 : 34, near: 5, far: 200 };

  // Filet de sécurité : si la toute première image WebGL ne part jamais (une
  // initialisation ratée, silencieuse, s'est déjà vue en développement), on
  // remonte le Canvas une fois plutôt que de laisser l'écran noir.
  const [canvasKey, setCanvasKey] = useState(0);
  const gotFrame = useRef(false);
  useEffect(() => {
    if (!pret) return;
    gotFrame.current = false;
    const timer = setTimeout(() => {
      if (!gotFrame.current) setCanvasKey((k) => k + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [pret, canvasKey]);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, background: "#1f160f" }}>
      {pret && (
        <SceneErrorBoundary key={canvasKey}>
          <Canvas
            shadows={RENDER_SHADOWS}
            dpr={RENDER_DPR}
            gl={GL_PROPS}
            camera={camera}
            style={CANVAS_STYLE}
            onCreated={({ gl }) => {
              setMaxAnisotropy(gl.capabilities.getMaxAnisotropy());
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
            }}
          >
            <color attach="background" args={["#1f160f"]} />
            <fogExp2 attach="fog" args={["#2c2014", 0.012]} />
            <FrameWatchdog onFirstFrame={() => (gotFrame.current = true)} />
            <Lights />

            <Suspense fallback={null}>
              <Board board={board} onSelectTile={onSelectTile} />
              <Tokens players={players} positions={positions} activePlayerId={activePlayerId} />
              {dice && <Dice values={dice.values} rolling={dice.rolling} rollKey={dice.key} at={[0, 0, 3.6]} />}
            </Suspense>

            <ActiveTileHalo board={board} tileIndex={activeTileIndex} />
            <FollowCamera compact={compact} follow={followPos} />
          </Canvas>
        </SceneErrorBoundary>
      )}
    </div>
  );
}
