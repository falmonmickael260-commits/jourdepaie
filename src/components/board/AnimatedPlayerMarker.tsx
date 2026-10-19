"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { PlayerToken } from "./PlayerToken";
import type { SpiralTile } from "@/data/board-geometry";
import type { PlayerTokenId } from "@/game/engine/types";

export function AnimatedPlayerMarker({
  tokenId,
  position,
  layout,
  dx = 0,
  dy = 0,
  isActive,
  bobDelay = 0,
  onArrived,
  onStep,
}: {
  tokenId: PlayerTokenId;
  position: number;
  layout: SpiralTile[];
  dx?: number;
  dy?: number;
  isActive: boolean;
  bobDelay?: number;
  onArrived?: () => void;
  onStep?: (tileIndex: number) => void;
}) {
  const controls = useAnimationControls();
  const prevPosition = useRef(position);
  const onArrivedRef = useRef(onArrived);
  const onStepRef = useRef(onStep);
  const [hopTick, setHopTick] = useState(0);

  useEffect(() => {
    onArrivedRef.current = onArrived;
    onStepRef.current = onStep;
  }, [onArrived, onStep]);

  useEffect(() => {
    const total = layout.length;
    const from = prevPosition.current;
    const to = position;
    prevPosition.current = position;

    const pointAt = (idx: number) => ({
      left: `${layout[idx].xPct + dx}%`,
      top: `${layout[idx].yPct + dy}%`,
    });

    if (from === to) {
      controls.set({ ...pointAt(to), opacity: 1 });
      return;
    }

    // Un pas par case (plutôt qu'une seule animation à trajectoire multiple) :
    // chaque arrivée est attendue individuellement, ce qui permet de faire
    // naître un petit effet de sillage case par case pendant le déplacement.
    const slideThrough = async (steps: number[]) => {
      for (let k = 1; k < steps.length; k++) {
        const idx = steps[k];
        setHopTick((t) => t + 1);
        await controls.start({
          ...pointAt(idx),
          transition: { duration: 0.26, ease: "easeInOut" },
        });
        onStepRef.current?.(idx);
      }
    };

    // Le parcours de référence est une spirale à sens unique (Départ -> Jour de
    // paie), pas une boucle fermée. Un "bouclage" (fin de mois) est donc rendu
    // par un court fondu plutôt qu'un déplacement glissé à travers tout le plateau.
    const wraps = to < from;

    const forward: number[] = [from];
    {
      let i = from;
      const forwardEnd = wraps ? total - 1 : to;
      while (i !== forwardEnd) {
        i++;
        forward.push(i);
      }
    }
    const rest: number[] = wraps ? [0] : [];
    if (wraps) {
      let j = 0;
      while (j !== to) {
        j++;
        rest.push(j);
      }
    }

    // Filet de sécurité : si l'animation ne se termine jamais (onglet en
    // arrière-plan, appareil très lent, animation interrompue), on force
    // malgré tout l'arrivée après un délai large plutôt que de bloquer le
    // tour indéfiniment. `settled` évite un double appel de `onArrived`.
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      onArrivedRef.current?.();
    };
    const expectedMs = (forward.length + rest.length) * 260 + (wraps ? 400 : 0) + 800;
    const safetyTimer = setTimeout(() => {
      controls.set({ ...pointAt(to), opacity: 1 });
      finish();
    }, expectedMs);

    async function run() {
      if (forward.length > 1) await slideThrough(forward);

      if (wraps) {
        await controls.start({ opacity: 0, transition: { duration: 0.18 } });
        controls.set({ ...pointAt(0), opacity: 0 });
        await controls.start({ opacity: 1, transition: { duration: 0.18 } });
        if (rest.length > 1) await slideThrough(rest);
      }

      finish();
    }

    run();

    return () => clearTimeout(safetyTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, layout.length]);

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
      initial={{
        left: `${layout[position].xPct + dx}%`,
        top: `${layout[position].yPct + dy}%`,
        opacity: 1,
      }}
      animate={controls}
    >
      <div className="ejdp-token-bob" style={{ animationDelay: `${bobDelay}s` }}>
        <PlayerToken tokenId={tokenId} ring={isActive} hopKey={hopTick} />
      </div>
    </motion.div>
  );
}
