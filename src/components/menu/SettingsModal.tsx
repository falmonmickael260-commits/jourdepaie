"use client";

import { Modal } from "@/components/ui/Modal";
import { useSettingsStore } from "@/game/store/useSettingsStore";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer">
      <span className="font-sans text-sm text-navy-800">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-emerald-600" : "bg-navy-900/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ivory-50 shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettingsStore();

  return (
    <Modal open={open} onClose={onClose} title="Paramètres">
      <div className="divide-y divide-navy-900/10">
        <Toggle
          label="Musique d'ambiance"
          checked={settings.musicEnabled}
          onChange={settings.setMusicEnabled}
        />
        <Toggle
          label="Effets sonores"
          checked={settings.sfxEnabled}
          onChange={settings.setSfxEnabled}
        />
        <Toggle
          label="Réduire les animations"
          checked={settings.reducedMotion}
          onChange={settings.setReducedMotion}
        />
        <Toggle
          label="Contraste élevé (accessibilité)"
          checked={settings.highContrast}
          onChange={settings.setHighContrast}
        />
      </div>
      <p className="mt-5 text-xs text-navy-800/50 font-sans leading-relaxed">
        Les sons sont générés par synthèse — aucun fichier audio externe n&apos;est
        requis. Le profil joueur et l&apos;historique des parties nécessitent la
        connexion au serveur multijoueur (non configurée dans cet environnement).
      </p>
    </Modal>
  );
}
