"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LobbyShell } from "@/components/lobby/LobbyShell";
import { Button } from "@/components/ui/Button";
import { useLobbyStore, type JoinError } from "@/game/store/useLobbyStore";
import { KeyRound } from "lucide-react";

const ERROR_LABEL: Record<JoinError, string> = {
  "not-found": "Aucun salon avec ce code n'est actif en ce moment. Vérifiez le code auprès de l'hôte.",
  full: "Ce salon est déjà complet.",
  started: "La partie a déjà commencé, impossible de rejoindre.",
  connection: "Connexion au serveur de salons impossible. Réessayez dans un instant.",
  unknown: "Impossible de rejoindre ce salon.",
};

export default function RejoindreSalonPage() {
  const router = useRouter();
  const joinLobby = useLobbyStore((s) => s.joinLobby);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || code.trim().length < 4 || loading) return;
    setError(null);
    setLoading(true);
    const result = await joinLobby(code.trim().toUpperCase(), name.trim());
    setLoading(false);
    if (!result.ok) {
      setError(ERROR_LABEL[result.error]);
      return;
    }
    router.push(`/salon/${code.trim().toUpperCase()}`);
  }

  return (
    <LobbyShell title="Rejoindre un salon" subtitle="Saisissez le code d'invitation partagé par l'hôte.">
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
          <span className="text-sm font-sans text-navy-800/70">Code d&apos;invitation</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={4}
            required
            placeholder="Ex. 7K2Q"
            className="rounded-lg border border-navy-900/15 px-3.5 py-2.5 font-ledger tracking-[0.3em] text-navy-900 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-gold-500/50 uppercase"
          />
        </label>

        {error && <p className="text-sm text-garnet-600">{error}</p>}

        <Button type="submit" icon={<KeyRound size={18} />} className="w-full justify-center" disabled={loading}>
          {loading ? "Connexion…" : "Rejoindre"}
        </Button>
      </form>
    </LobbyShell>
  );
}
