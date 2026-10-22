"use client";

/**
 * Le moteur enregistre chaque mouvement d'argent (carte, salaire, etc.) dans
 * `state.transactions`, mais rien ne l'affichait auparavant : le solde du
 * joueur changeait dans FinancialPanel sans qu'on sache jamais pourquoi.
 * Ce composant diffuse une courte notification pour chaque NOUVELLE
 * transaction (jamais pour l'historique déjà présent au montage/à la
 * resynchronisation, pour ne pas spammer l'écran à l'arrivée sur la partie).
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/game/store/useGameStore";

interface ToastItem {
  id: string;
  reason: string;
  amount: number;
  playerName: string;
}

const VISIBLE_MS = 4000;

export function TransactionToasts() {
  const transactions = useGameStore((s) => s.state.transactions);
  const players = useGameStore((s) => s.state.players);
  const seenIds = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(transactions.map((t) => t.id));
      return;
    }
    const seen = seenIds.current;
    const fresh = transactions.filter((t) => !seen.has(t.id));
    if (fresh.length === 0) return;

    const newToasts = fresh.map((t) => {
      seen.add(t.id);
      return {
        id: t.id,
        reason: t.reason,
        amount: t.amount,
        playerName: players.find((p) => p.id === t.playerId)?.name ?? "?",
      };
    });

    setToasts((prev) => [...prev, ...newToasts]);
    newToasts.forEach((toast) => {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== toast.id));
      }, VISIBLE_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none px-4 w-full">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`px-4 py-2 rounded-full shadow-[var(--shadow-lifted)] font-sans text-sm flex items-center gap-2 whitespace-nowrap ${
              t.amount >= 0 ? "bg-emerald-700 text-ivory-50" : "bg-garnet-600 text-ivory-50"
            }`}
          >
            <span className="font-semibold">{t.playerName}</span>
            <span className="opacity-90">{t.reason}</span>
            <span className="font-display tabular-nums">
              {t.amount >= 0 ? "+" : ""}
              {t.amount} €
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
