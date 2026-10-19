"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SESSION_KEY = "ejdp-intro-seen";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

/** Généré uniquement côté client (après montage) pour éviter tout décalage SSR/hydratation lié à Math.random(). */
function useParticles(count: number): Particle[] {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Volontairement différé au post-montage : générer ces positions aléatoires
    // pendant le rendu SSR provoquerait un écart serveur/client à l'hydratation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(
      Array.from({ length: count }, (_, id) => ({
        id,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.2,
        delay: Math.random() * 1.4,
        duration: 2.2 + Math.random() * 2.2,
      }))
    );
  }, [count]);

  return particles;
}

export function IntroLoader({ onFinish }: { onFinish: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    // Lecture de window.innerWidth : nécessairement post-montage (non disponible au SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSmallScreen(window.innerWidth < 640);

    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === "1";
    const totalDuration = prefersReducedMotion ? 350 : alreadySeen ? 900 : 2400;

    const start = performance.now();
    let raf: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(pct);
      if (elapsed < totalDuration) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(false);
        setTimeout(onFinish, 420);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const particles = useParticles(isSmallScreen ? 16 : 36);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-navy-950 grain-overlay"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 42%, rgba(43,143,120,0.18), transparent 70%), radial-gradient(90% 70% at 50% 100%, rgba(5,7,13,0.9), transparent)",
            }}
          />

          {!prefersReducedMotion &&
            particles.map((p) => (
              <motion.span
                key={p.id}
                className="absolute rounded-full bg-gold-400"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  boxShadow: "0 0 6px rgba(230,205,150,0.8)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}

          <div className="relative flex flex-col items-center gap-8 px-6">
            <svg
              viewBox="0 0 320 90"
              className="w-[min(72vw,320px)] overflow-visible"
              aria-hidden
            >
              <motion.path
                d="M10 70 C 60 20, 120 20, 160 45 S 260 70, 310 20"
                fill="none"
                stroke="url(#ejdp-path-grad)"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.9 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: prefersReducedMotion ? 0.2 : 1.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="ejdp-path-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d4af7a" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#e6cd96" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#d4af7a" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {!prefersReducedMotion &&
                [0, 1, 2].map((i) => (
                  <circle
                    key={i}
                    r={4}
                    fill="#e6cd96"
                    className="ejdp-coin-travel"
                    style={{
                      offsetPath:
                        "path('M10 70 C 60 20, 120 20, 160 45 S 260 70, 310 20')",
                      animationDelay: `${0.3 + i * 0.35}s`,
                    }}
                  />
                ))}
            </svg>

            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.9, duration: 0.6 }}
            >
              <h1
                className="font-display font-semibold text-[2.6rem] sm:text-6xl tracking-tight text-ivory-50"
                style={{
                  textShadow: "0 0 40px rgba(212,175,122,0.35)",
                }}
              >
                EN JOUR DE <span className="text-gold-400 italic">PAIE</span>
              </h1>
              <p className="mt-3 font-sans text-sm sm:text-base text-ivory-200/70 tracking-[0.18em] uppercase">
                Chaque mois compte. Chaque décision aussi.
              </p>
            </motion.div>

            <div className="w-56 sm:w-72">
              <div className="h-[3px] w-full rounded-full bg-ivory-50/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
