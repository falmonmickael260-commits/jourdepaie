"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Scène d'arrière-plan du menu principal — composition vectorielle originale
 * (silhouette de ville, calendrier stylisé, pièces en lévitation).
 * Aucun asset externe : tout est dessiné en SVG/CSS pour rester 100% original.
 */
export function SceneBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #05070d 0%, #0a0e1a 38%, #0f4336 100%)",
        }}
      />

      {/* Halo central */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,122,0.14), transparent 65%)",
        }}
      />

      {/* Calendrier stylisé */}
      <svg
        viewBox="0 0 400 400"
        className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 w-[min(80vw,520px)] opacity-80"
        aria-hidden
      >
        <g opacity={0.5}>
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={60 + col * 58}
                y={100 + row * 44}
                width={44}
                height={30}
                rx={4}
                fill="none"
                stroke="#d4af7a"
                strokeOpacity={0.35}
                strokeWidth={1}
              />
            ))
          )}
        </g>
        <circle
          cx={200}
          cy={168}
          r={150}
          fill="none"
          stroke="#e6cd96"
          strokeOpacity={0.18}
          strokeWidth={1.5}
        />
      </svg>

      {/* Skyline */}
      <svg
        viewBox="0 0 1200 260"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[32vh] min-h-[160px]"
        aria-hidden
      >
        {[
          { x: 0, w: 90, h: 140, o: 0.9 },
          { x: 80, w: 60, h: 190, o: 0.95 },
          { x: 150, w: 110, h: 110, o: 0.85 },
          { x: 270, w: 70, h: 220, o: 1 },
          { x: 350, w: 130, h: 150, o: 0.9 },
          { x: 490, w: 60, h: 240, o: 1 },
          { x: 560, w: 100, h: 170, o: 0.88 },
          { x: 670, w: 80, h: 200, o: 0.95 },
          { x: 760, w: 120, h: 130, o: 0.85 },
          { x: 890, w: 70, h: 230, o: 1 },
          { x: 970, w: 110, h: 160, o: 0.9 },
          { x: 1090, w: 110, h: 190, o: 0.92 },
        ].map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={260 - b.h}
            width={b.w}
            height={b.h}
            fill="#0a2f24"
            opacity={b.o}
          />
        ))}
        {/* Fenêtres dorées */}
        {Array.from({ length: 60 }).map((_, i) => (
          <rect
            key={`w-${i}`}
            x={20 + (i % 12) * 98 + (i % 3) * 6}
            y={120 + Math.floor(i / 12) * 26}
            width={6}
            height={9}
            fill="#e6cd96"
            opacity={0.15 + ((i * 7) % 10) / 40}
          />
        ))}
      </svg>

      {/* Pièces flottantes */}
      {!prefersReducedMotion &&
        [
          { x: "12%", y: "22%", size: 26, delay: 0 },
          { x: "85%", y: "16%", size: 34, delay: 0.4 },
          { x: "20%", y: "68%", size: 20, delay: 0.8 },
          { x: "78%", y: "62%", size: 28, delay: 1.1 },
          { x: "92%", y: "40%", size: 18, delay: 0.6 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: c.x,
              top: c.y,
              width: c.size,
              height: c.size,
              background:
                "radial-gradient(circle at 35% 30%, #f2e3bd, #d4af7a 55%, #8f6c3b 100%)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.25)",
            }}
            animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
            transition={{
              duration: 5 + i,
              delay: c.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/40" />
    </div>
  );
}
