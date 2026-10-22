"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useGameStore } from "@/game/store/useGameStore";
import { useLobbyStore } from "@/game/store/useLobbyStore";
import { Button } from "@/components/ui/Button";
import { useSfx } from "@/lib/audio/useSfx";
import {
  Sparkles,
  TrendingUp,
  Gavel,
  Bell,
  Landmark,
  PiggyBank,
  Gift,
  Mail,
  type LucideIcon,
} from "lucide-react";
import type { CardCategory } from "@/game/rules/types";

const CATEGORY_META: Record<CardCategory, { label: string; icon: LucideIcon; accent: string; chip: string; border: string }> = {
  investir: { label: "Investir", icon: TrendingUp, accent: "text-emerald-700", chip: "bg-emerald-700/12", border: "border-emerald-700/35" },
  encherir: { label: "Enchérir", icon: Gavel, accent: "text-copper-700", chip: "bg-copper-600/12", border: "border-copper-600/35" },
  evenement: { label: "Événement", icon: Sparkles, accent: "text-gold-700", chip: "bg-gold-500/18", border: "border-gold-500/45" },
  courrier: { label: "Courrier", icon: Mail, accent: "text-navy-700", chip: "bg-navy-700/12", border: "border-navy-700/35" },
  notification: { label: "Notification", icon: Bell, accent: "text-copper-700", chip: "bg-copper-600/12", border: "border-copper-600/35" },
  pret: { label: "Prêt", icon: Landmark, accent: "text-garnet-600", chip: "bg-garnet-600/12", border: "border-garnet-600/35" },
  epargne: { label: "Épargne", icon: PiggyBank, accent: "text-emerald-700", chip: "bg-emerald-700/12", border: "border-emerald-700/35" },
  anniversaire: { label: "Anniversaire", icon: Gift, accent: "text-gold-700", chip: "bg-gold-500/18", border: "border-gold-500/45" },
};

export function CardOverlay() {
  const pendingCard = useGameStore((s) => s.state.activeCard);
  const activePlayer = useGameStore((s) => s.state.players[s.state.activePlayerIndex]);
  const chooseCardOption = useGameStore((s) => s.chooseCardOption);
  const lobby = useLobbyStore((s) => s.lobby);
  const myPlayerId = useLobbyStore((s) => s.myPlayerId);
  // En mode local (pas de salon réseau), il n'y a qu'un seul appareil : tout
  // le monde peut agir. En réseau, seul le joueur dont c'est le tour peut
  // choisir — les autres voient la carte mais pas de boutons actifs.
  const isMyTurn = !lobby || myPlayerId === activePlayer?.id;
  const playSfx = useSfx();

  useEffect(() => {
    if (pendingCard) playSfx("card-flip");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCard?.id]);

  const meta = pendingCard ? CATEGORY_META[pendingCard.category] : null;
  const Icon = meta?.icon ?? Sparkles;

  return (
    <AnimatePresence>
      {pendingCard && meta && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div style={{ perspective: 1400 }}>
            <motion.div
              className="relative w-[min(90vw,380px)]"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: -130, y: -30, opacity: 0 }}
              animate={{ rotateY: 0, y: 0, opacity: 1 }}
              exit={{ rotateY: 110, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Dos de carte */}
              <div
                className="absolute inset-0 rounded-2xl grain-overlay border-2 border-gold-400/40"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "linear-gradient(155deg, #0f4336 0%, #0a2f24 60%, #061f18 100%)",
                }}
              >
                <div className="absolute inset-3 rounded-xl border border-gold-400/30 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-70" aria-hidden>
                    <circle cx={50} cy={50} r={44} fill="none" stroke="#d4af7a" strokeWidth={1} strokeDasharray="2 5" />
                    <circle cx={50} cy={50} r={34} fill="none" stroke="#e6cd96" strokeWidth={0.7} />
                    <text x={50} y={57} textAnchor="middle" fontSize={13} fill="#e6cd96" fontFamily="var(--font-display)" fontStyle="italic">
                      EJP
                    </text>
                  </svg>
                </div>
              </div>

              {/* Face avant */}
              <div
                className={`relative surface-card grain-overlay rounded-2xl p-6 sm:p-7 shadow-[var(--shadow-lifted)] border-2 ${meta.border} overflow-hidden`}
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* Fleurons d'angle */}
                {[
                  "top-2 left-2 rotate-0",
                  "top-2 right-2 rotate-90",
                  "bottom-2 left-2 -rotate-90",
                  "bottom-2 right-2 rotate-180",
                ].map((pos, i) => (
                  <svg key={i} viewBox="0 0 24 24" className={`absolute w-4 h-4 text-copper-600/30 ${pos}`} aria-hidden>
                    <path d="M2 2 L2 10 M2 2 L10 2" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                  </svg>
                ))}

                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`ejdp-tile-sheen relative rounded-full p-2.5 ${meta.chip} ${meta.accent} overflow-hidden`}>
                    <Icon size={18} className="relative z-10" />
                  </span>
                  <span className={`text-xs tracking-[0.2em] uppercase font-semibold ${meta.accent}`}>
                    {meta.label}
                  </span>
                </div>

                <h3 className="font-display text-2xl text-navy-900 mb-2 leading-snug">{pendingCard.title}</h3>
                <p className="font-sans text-navy-800/70 text-sm leading-relaxed mb-6">
                  {pendingCard.description}
                </p>

                {pendingCard.status !== "confirmed" && (
                  <p className="text-xs text-garnet-600 mb-5 bg-garnet-600/10 rounded-lg px-3 py-2">
                    Carte d&apos;exemple — effet non vérifié contre une notice officielle.
                  </p>
                )}

                {!isMyTurn ? (
                  <p className="text-sm text-navy-800/50 font-sans text-center py-2">
                    En attente de la décision de {activePlayer?.name}…
                  </p>
                ) : pendingCard.effect.type === "choice" ? (
                  <div className="flex flex-col gap-2">
                    {pendingCard.effect.options.map((opt, i) => (
                      <Button key={i} variant="outline" className="w-full justify-center" onClick={() => chooseCardOption(i)}>
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button className="w-full justify-center" onClick={() => chooseCardOption(0)}>
                    Continuer
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
