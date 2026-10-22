"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Bike, Calendar, Clock, Coins, Dices, Flag, Gift, Mail, Moon, ShoppingBag, Sparkles, Tag } from "lucide-react";
import type { TileDefinition } from "@/game/rules/types";
import { cn } from "@/lib/utils";

const TILE_ICON: Record<TileDefinition["type"], typeof Calendar> = {
  depart: Flag,
  paie: Banknote,
  dimanche: Moon,
  courrier: Mail,
  acquisition: ShoppingBag,
  vendez: Tag,
  evenement: Sparkles,
  loterie: Dices,
  anniversaire: Gift,
  cotisation: Bike,
  cagnotte: Coins,
  "changement-heure": Clock,
};

/** Quatre teintes de cases "jour" qui alternent le long du parcours, pour un plateau
 * qui respire plutôt qu'une rangée uniforme de cases identiques. */
const JOUR_VARIANTS = [
  { bg: "linear-gradient(155deg, #fdfaf1 0%, #f0e4c6 100%)", border: "rgba(149,88,46,0.28)", text: "#8f6c3b" },
  { bg: "linear-gradient(155deg, #e8f3ed 0%, #c3e0d1 100%)", border: "rgba(22,89,74,0.3)", text: "#16594a" },
  { bg: "linear-gradient(155deg, #f7ead6 0%, #e3c89b 100%)", border: "rgba(149,88,46,0.35)", text: "#7a4524" },
  { bg: "linear-gradient(155deg, #fbf0d5 0%, #ecd698 100%)", border: "rgba(179,138,82,0.4)", text: "#8f6c3b" },
];

const MILESTONE_STYLE: Partial<Record<TileDefinition["type"], { bg: string; border: string; text: string; chip: string }>> = {
  depart: {
    bg: "linear-gradient(155deg, #e3f1ea 0%, #a8d6bd 65%, #5f9e80 100%)",
    border: "rgba(10,47,36,0.4)",
    text: "#06241c",
    chip: "bg-white/40",
  },
  paie: {
    bg: "linear-gradient(155deg, #fbefc7 0%, #e3bd73 55%, #a9772e 100%)",
    border: "rgba(92,61,26,0.45)",
    text: "#3d2c14",
    chip: "bg-white/40",
  },
  evenement: {
    bg: "linear-gradient(155deg, #fdf3d9 0%, #edca7e 60%, #c99a4a 100%)",
    border: "rgba(143,108,59,0.4)",
    text: "#5c3d1a",
    chip: "bg-white/40",
  },
  dimanche: {
    bg: "linear-gradient(155deg, #eef0ef 0%, #d3d8d6 65%, #aeb6b3 100%)",
    border: "rgba(60,70,66,0.3)",
    text: "#3c4642",
    chip: "bg-white/40",
  },
};

export function BoardTile({
  tile,
  xPct,
  yPct,
  isCorner,
  isActive,
  isResolved,
  index = 0,
  onSelect,
}: {
  tile: TileDefinition;
  xPct: number;
  yPct: number;
  isCorner: boolean;
  isActive: boolean;
  isResolved: boolean;
  index?: number;
  onSelect: (tile: TileDefinition) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = TILE_ICON[tile.type] ?? Calendar;
  const isMilestone = tile.type === "depart" || tile.type === "paie";
  const big = isCorner || isMilestone;

  const milestone = MILESTONE_STYLE[tile.type];
  const jourVariant = JOUR_VARIANTS[index % JOUR_VARIANTS.length];
  const style = milestone ?? { ...jourVariant, chip: "bg-white/50" };

  return (
    <div
      className={cn("absolute z-10", big ? "w-12 h-12 sm:w-[60px] sm:h-[60px]" : "w-9 h-9 sm:w-11 sm:h-11")}
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(tile)}
        aria-label={tile.label}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "ejdp-tile-sheen relative w-full h-full rounded-[14px] flex flex-col items-center justify-center cursor-pointer overflow-hidden",
          "border-2 transition-[border-color,box-shadow] duration-150",
          isActive && "ring-2 ring-gold-500 ring-offset-2 ring-offset-ivory-100"
        )}
        style={{
          animationDelay: `${(index % 7) * 0.9}s`,
          background: isResolved ? "rgba(10,14,26,0.05)" : style.bg,
          borderColor: isResolved ? "rgba(10,14,26,0.1)" : style.border,
          color: isResolved ? "rgba(10,14,26,0.3)" : style.text,
          boxShadow: isResolved
            ? "none"
            : "0 2px 6px rgba(74,52,20,0.22), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 3px rgba(74,52,20,0.12)",
        }}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full",
            big ? "w-5 h-5 sm:w-7 sm:h-7" : "w-4 h-4 sm:w-5 sm:h-5",
            !isResolved && style.chip
          )}
        >
          <Icon size={big ? 16 : 12} className="sm:hidden" strokeWidth={1.8} />
          <Icon size={big ? 20 : 14} className="hidden sm:block" strokeWidth={1.8} />
        </span>
        {isMilestone && (
          <span className="mt-0.5 sm:mt-1 text-[0.4rem] sm:text-[0.5rem] font-semibold tracking-[0.1em] sm:tracking-[0.12em] uppercase leading-none text-center px-0.5">
            {tile.type === "depart" ? "Départ" : "Paie"}
          </span>
        )}

        {!isMilestone && !isResolved && (
          <span className="absolute top-0.5 right-1 text-[0.45rem] sm:text-[0.55rem] font-semibold tabular-nums leading-none opacity-70">
            {tile.index}
          </span>
        )}

        {isActive && (
          <motion.span
            className="absolute -inset-1.5 rounded-[18px] border-2 border-gold-400 pointer-events-none"
            animate={{ opacity: [0.9, 0.15, 0.9], scale: [1, 1.04, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}
      </motion.button>

      {hovered && (
        <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-max max-w-[180px] px-3 py-2 rounded-lg bg-navy-950 text-ivory-50 text-xs shadow-[var(--shadow-lifted)] pointer-events-none">
          <p className="font-semibold">{tile.label}</p>
          {tile.status === "pending" && (
            <p className="text-gold-300/80 mt-0.5">Règle non vérifiée</p>
          )}
        </div>
      )}
    </div>
  );
}
