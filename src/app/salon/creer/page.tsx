"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LobbyShell } from "@/components/lobby/LobbyShell";
import { Button } from "@/components/ui/Button";
import { useLobbyStore } from "@/game/store/useLobbyStore";
import { DoorOpen } from "lucide-react";

export default function CreerSalonPage() {
  const router = useRouter();
  const createLobby = useLobbyStore((s) => s.createLobby);
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setError(null);
    setLoading(true);
    const result = await createLobby(name.trim(), maxPlayers);
    setLoading(false);
    if (!result.ok) {
      setError("Connexion au serveur de salons impossible. Réessayez dans un instant.");
      return;
    }
    router.push(`/salon/${result.code}`);
  }

  return (
    <LobbyShell title="Créer un salon" subtitle="Vous serez l'hôte de cette partie privée.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-sans text-navy-800/70">Votre pseudonyme</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            placeholder="Ex. Camille"
            className="rounded-lg border border-navy-900/15 px-3.5 py-2.5 font-sans text-navy-900 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-sans text-navy-800/70">Nombre de joueurs</span>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`w-10 h-10 rounded-lg font-ledger text-sm transition-colors cursor-pointer ${
                  maxPlayers === n
                    ? "surface-gold"
                    : "bg-navy-900/5 text-navy-800 hover:bg-navy-900/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        <p className="text-xs text-navy-800/45 font-sans leading-relaxed">
          Durée de partie : 3 mois (fixée par les règles du projet). Le salon et
          la partie (dés, cartes, tours) sont tous les deux partagés en temps
          réel via le serveur — chacun ne peut agir que pour son propre pion.
        </p>

        {error && <p className="text-sm text-garnet-600">{error}</p>}

        <Button type="submit" icon={<DoorOpen size={18} />} className="w-full justify-center" disabled={loading}>
          {loading ? "Connexion…" : "Créer le salon"}
        </Button>
      </form>
    </LobbyShell>
  );
}
