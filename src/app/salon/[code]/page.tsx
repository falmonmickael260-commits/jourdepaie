"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut, Play } from "lucide-react";
import { LobbyShell } from "@/components/lobby/LobbyShell";
import { Button } from "@/components/ui/Button";
import { PlayerToken } from "@/components/board/PlayerToken";
import { useLobbyStore } from "@/game/store/useLobbyStore";

const DEMO_TOKENS = ["piece-or", "porte-monnaie", "cle", "horloge", "valise", "trefle"] as const;

export default function SalonPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const lobby = useLobbyStore((s) => s.lobby);
  const myPlayerId = useLobbyStore((s) => s.myPlayerId);
  const leaveLobby = useLobbyStore((s) => s.leaveLobby);
  const startGame = useLobbyStore((s) => s.startGame);
  const reset = useLobbyStore((s) => s.reset);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lobby?.code === code && lobby.started) {
      router.replace(`/partie/${code}`);
    }
  }, [lobby?.code, lobby?.started, code, router]);

  if (!lobby || lobby.code !== code) {
    return (
      <LobbyShell title="Salon introuvable" subtitle="Ce code n'existe pas dans cet onglet.">
        <Button onClick={() => router.push("/salon/rejoindre")} className="w-full justify-center">
          Retour
        </Button>
      </LobbyShell>
    );
  }

  const host = lobby.players.find((p) => p.isHost);
  const isHost = myPlayerId !== null && host?.id === myPlayerId;

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleLeave() {
    leaveLobby();
    reset();
    router.push("/");
  }

  function handleStart() {
    startGame();
    router.push(`/partie/${code}`);
  }

  return (
    <LobbyShell title="Salle d'attente" subtitle={`Hôte : ${host?.name ?? "—"}`}>
      <div className="flex items-center justify-between rounded-xl bg-navy-900/5 px-4 py-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-copper-700/70 font-sans">Code d&apos;invitation</p>
          <p className="font-ledger text-2xl tracking-[0.3em] text-navy-900">{code}</p>
        </div>
        <button
          onClick={copyCode}
          className="rounded-full p-2.5 bg-navy-900/5 hover:bg-navy-900/10 transition-colors cursor-pointer"
          aria-label="Copier le code"
        >
          {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
        </button>
      </div>

      <ul className="flex flex-col gap-2.5 mb-6">
        {lobby.players.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border border-navy-900/10 px-3.5 py-2.5">
            <PlayerToken tokenId={DEMO_TOKENS[i % DEMO_TOKENS.length]} size={28} />
            <span className="flex-1 font-sans text-navy-900">
              {p.name}
              {p.isHost && <span className="ml-2 text-xs text-gold-600 font-semibold">HÔTE</span>}
              {p.id === myPlayerId && <span className="ml-2 text-xs text-emerald-700 font-semibold">VOUS</span>}
            </span>
            <span className={`w-2 h-2 rounded-full ${p.connected ? "bg-emerald-500" : "bg-garnet-500"}`} />
          </li>
        ))}
        {Array.from({ length: Math.max(0, lobby.maxPlayers - lobby.players.length) }).map((_, i) => (
          <li
            key={`empty-${i}`}
            className="flex items-center gap-3 rounded-lg border border-dashed border-navy-900/15 px-3.5 py-2.5 text-navy-800/35 text-sm font-sans"
          >
            Place disponible
          </li>
        ))}
      </ul>

      <div className="flex gap-3">
        <Button variant="ghost" icon={<LogOut size={18} />} onClick={handleLeave} className="flex-1 justify-center">
          Quitter
        </Button>
        {isHost && (
          <Button
            icon={<Play size={18} />}
            onClick={handleStart}
            disabled={lobby.players.length < 2}
            className="flex-1 justify-center"
          >
            Lancer
          </Button>
        )}
      </div>
      {isHost && lobby.players.length < 2 && (
        <p className="text-xs text-navy-800/45 font-sans mt-3">Il faut au moins 2 joueurs pour lancer la partie.</p>
      )}
      {!isHost && (
        <p className="text-xs text-navy-800/45 font-sans mt-3">
          En attente que l&apos;hôte ({host?.name}) lance la partie.
        </p>
      )}
    </LobbyShell>
  );
}
