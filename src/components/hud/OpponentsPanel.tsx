"use client";

import { Panel } from "@/components/ui/Panel";
import { PlayerToken } from "@/components/board/PlayerToken";
import { useGameStore } from "@/game/store/useGameStore";

export function OpponentsPanel() {
  const players = useGameStore((s) => s.state.players);
  const activePlayerIndex = useGameStore((s) => s.state.activePlayerIndex);

  return (
    <Panel>
      <p className="text-xs tracking-[0.2em] uppercase text-copper-700/70 font-sans mb-3">
        Joueurs
      </p>
      <ul className="flex flex-col gap-2.5">
        {players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <PlayerToken tokenId={p.tokenId} size={24} ring={i === activePlayerIndex} />
            <span className="font-sans text-sm text-navy-900 flex-1">{p.name}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${p.connected ? "bg-emerald-500" : "bg-garnet-500"}`}
              title={p.connected ? "Connecté" : "Déconnecté"}
            />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.7rem] text-navy-800/40 font-sans leading-snug">
        Les soldes détaillés des autres joueurs ne sont affichés que si les règles
        vérifiées le permettent.
      </p>
    </Panel>
  );
}
