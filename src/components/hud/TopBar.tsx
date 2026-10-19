"use client";

import Link from "next/link";
import { BookOpenText, Settings as SettingsIcon, Wifi } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "@/game/store/useGameStore";
import { SettingsModal } from "@/components/menu/SettingsModal";
import { Logo } from "@/components/ui/Logo";

export function TopBar() {
  const month = useGameStore((s) => s.state.month);
  const day = useGameStore((s) => s.state.day);
  const activePlayer = useGameStore((s) => s.state.players[s.state.activePlayerIndex]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-navy-950/90 backdrop-blur-sm border-b border-gold-500/15">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <Logo compact />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4 text-ivory-100/80 text-xs sm:text-sm font-sans min-w-0">
          <span className="hidden sm:inline">
            Mois <strong className="text-ivory-50">{month}</strong> / 3
          </span>
          <span className="hidden md:inline">
            Jour <strong className="text-ivory-50">{day}</strong>
          </span>
          <span className="sm:hidden font-ledger text-ivory-50 shrink-0">
            M{month}·J{day}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate text-gold-300 font-semibold">{activePlayer?.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full p-2 text-emerald-400" title="Connecté (démo locale)">
            <Wifi size={16} />
          </span>
          <Link
            href="/regles"
            className="rounded-full p-2 text-ivory-100/70 hover:text-gold-300 transition-colors"
            aria-label="Règles du jeu"
          >
            <BookOpenText size={16} />
          </Link>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-full p-2 text-ivory-100/70 hover:text-gold-300 transition-colors cursor-pointer"
            aria-label="Paramètres"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
