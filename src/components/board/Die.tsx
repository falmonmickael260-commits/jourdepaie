"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HALF = 26;

/** Dispositions de pastilles pour chaque face (grille 3x3), faces opposées = 7. */
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Face({ value, transform }: { value: number; transform: string }) {
  return (
    <div
      className="absolute inset-0 rounded-[8px] bg-ivory-50 border border-navy-900/10"
      style={{ transform, backfaceVisibility: "hidden" }}
    >
      <div className="absolute inset-[14%] grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }, (_, i) => {
          const r = Math.floor(i / 3);
          const c = i % 3;
          const active = PIP_LAYOUTS[value].some(([pr, pc]) => pr === r && pc === c);
          return (
            <div key={i} className="flex items-center justify-center">
              {active && <span className="w-[22%] aspect-square rounded-full bg-navy-900" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const FACE_END_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

export function Die({ value, rolling }: { value: number; rolling: boolean }) {
  // La face à montrer est calculée DIRECTEMENT depuis les props à chaque
  // rendu — jamais via un état local dérivé à resynchroniser dans un effet.
  const end = FACE_END_ROTATION[value] ?? FACE_END_ROTATION[1];
  const target = { rotateX: end.x, rotateY: end.y };

  // `key` change à chaque arrêt sur une nouvelle face : force un nouveau
  // montage du composant plutôt qu'une transition d'une valeur `animate` à
  // une autre. Sans ça, `animate` passait de `undefined` (pendant le lancer,
  // piloté par la classe CSS) à `target` à l'arrêt, et framer-motion ne
  // reprenait pas toujours la main sur la rotation — le dé restait figé sur
  // sa face de repos ("1") quel que soit le chiffre réellement tiré.
  return (
    <div style={{ perspective: 320 }} className="w-[52px] h-[52px]">
      <motion.div
        key={rolling ? "rolling" : `face-${value}`}
        className={cn("relative w-full h-full", rolling && "ejdp-die-tumble")}
        style={{ transformStyle: "preserve-3d" }}
        initial={rolling ? false : { rotateX: target.rotateX - 25, rotateY: target.rotateY + 20 }}
        animate={rolling ? undefined : target}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <Face value={1} transform={`translateZ(${HALF}px)`} />
        <Face value={6} transform={`rotateY(180deg) translateZ(${HALF}px)`} />
        <Face value={2} transform={`rotateY(90deg) translateZ(${HALF}px)`} />
        <Face value={5} transform={`rotateY(-90deg) translateZ(${HALF}px)`} />
        <Face value={3} transform={`rotateX(90deg) translateZ(${HALF}px)`} />
        <Face value={4} transform={`rotateX(-90deg) translateZ(${HALF}px)`} />
      </motion.div>
    </div>
  );
}
