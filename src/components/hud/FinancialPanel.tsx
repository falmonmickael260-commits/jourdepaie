"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Wallet, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/game/store/useGameStore";

function formatEuros(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function Line({
  icon: Icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  tone?: "debt";
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-navy-800/70 font-sans">
        <Icon size={15} />
        {label}
      </span>
      <motion.span
        animate={highlight ? { scale: [1, 1.18, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`font-ledger text-[0.95rem] tabular-nums ${
          tone === "debt" && value > 0 ? "text-garnet-600" : "text-navy-900"
        }`}
      >
        {formatEuros(value)}
      </motion.span>
    </div>
  );
}

export function FinancialPanel() {
  const activePlayer = useGameStore((s) => s.state.players[s.state.activePlayerIndex]);
  const [delta, setDelta] = useState<{ key: number; amount: number } | null>(null);
  const [savingsPulse, setSavingsPulse] = useState(false);
  const prevCash = useRef(activePlayer?.account.cash);
  const prevSavings = useRef(activePlayer?.account.savings);
  const deltaKey = useRef(0);

  useEffect(() => {
    if (prevCash.current === undefined) {
      prevCash.current = activePlayer.account.cash;
      return;
    }
    const diff = activePlayer.account.cash - prevCash.current;
    prevCash.current = activePlayer.account.cash;
    if (diff === 0) return;

    const key = deltaKey.current++;
    setDelta({ key, amount: diff });
    const t = setTimeout(() => setDelta((d) => (d?.key === key ? null : d)), 1100);
    return () => clearTimeout(t);
  }, [activePlayer?.account.cash]);

  useEffect(() => {
    if (prevSavings.current === undefined) {
      prevSavings.current = activePlayer.account.savings;
      return;
    }
    if (activePlayer.account.savings !== prevSavings.current) {
      prevSavings.current = activePlayer.account.savings;
      setSavingsPulse(true);
      const t = setTimeout(() => setSavingsPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [activePlayer?.account.savings]);

  if (!activePlayer) return null;
  const { cash, savings, debt, investments } = activePlayer.account;
  const isGain = (delta?.amount ?? 0) > 0;

  return (
    <Panel className="relative overflow-visible">
      <p className="text-xs tracking-[0.2em] uppercase text-copper-700/70 font-sans mb-1">
        {activePlayer.name}
      </p>
      <div className="relative flex items-baseline gap-2 mb-2">
        <motion.span
          key={delta?.key ?? "idle"}
          animate={delta ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.45 }}
          className="font-ledger text-3xl text-navy-900 tabular-nums"
        >
          {formatEuros(cash)}
        </motion.span>

        <AnimatePresence>
          {delta && (
            <motion.span
              key={delta.key}
              initial={{ opacity: 0, y: 2, scale: 0.9 }}
              animate={{ opacity: 1, y: -2, scale: 1 }}
              exit={{ opacity: 0, y: -22 }}
              transition={{ duration: 0.35 }}
              className={`absolute left-full ml-2 bottom-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 ${
                isGain ? "bg-emerald-600/15 text-emerald-700" : "bg-garnet-600/15 text-garnet-600"
              }`}
            >
              {isGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isGain ? "+" : ""}
              {formatEuros(delta.amount)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <p className="text-xs text-navy-800/50 font-sans mb-3">Disponible</p>

      <div className="divide-y divide-navy-900/10 border-t border-navy-900/10">
        <Line icon={PiggyBank} label="Épargne" value={savings} highlight={savingsPulse} />
        <Line icon={TrendingDown} label="Dettes" value={debt} tone="debt" />
        <Line icon={Wallet} label="Investissements" value={investments} />
      </div>
    </Panel>
  );
}
