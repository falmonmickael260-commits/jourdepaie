import Link from "next/link";
import { DoorOpen, KeyRound } from "lucide-react";
import { LobbyShell } from "@/components/lobby/LobbyShell";

export default function JouerPage() {
  return (
    <LobbyShell title="Jouer en ligne" subtitle="Créez une partie privée ou rejoignez un salon existant.">
      <div className="flex flex-col gap-3">
        <Link
          href="/salon/creer"
          className="flex items-center gap-4 rounded-xl border border-copper-600/20 px-5 py-4 hover:border-gold-500/50 hover:bg-gold-500/5 transition-colors"
        >
          <span className="surface-gold rounded-xl p-2.5">
            <DoorOpen size={20} />
          </span>
          <span>
            <span className="block font-display text-lg text-navy-900">Créer un salon</span>
            <span className="block text-sm text-navy-800/55">Devenez l&apos;hôte et invitez vos amis</span>
          </span>
        </Link>

        <Link
          href="/salon/rejoindre"
          className="flex items-center gap-4 rounded-xl border border-copper-600/20 px-5 py-4 hover:border-gold-500/50 hover:bg-gold-500/5 transition-colors"
        >
          <span className="surface-gold rounded-xl p-2.5">
            <KeyRound size={20} />
          </span>
          <span>
            <span className="block font-display text-lg text-navy-900">Rejoindre un salon</span>
            <span className="block text-sm text-navy-800/55">Avec un code d&apos;invitation</span>
          </span>
        </Link>
      </div>
    </LobbyShell>
  );
}
