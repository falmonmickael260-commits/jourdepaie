"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Globe2, DoorOpen, KeyRound, BookOpenText, Settings, Volume2, VolumeX } from "lucide-react";
import { SceneBackground } from "./SceneBackground";
import { SettingsModal } from "@/components/menu/SettingsModal";
import { Logo } from "@/components/ui/Logo";
import { useSettingsStore } from "@/game/store/useSettingsStore";

const menuItems = [
  {
    href: "/jouer",
    label: "Jouer en ligne",
    description: "Créer une partie ou rejoindre un salon privé",
    icon: Globe2,
  },
  {
    href: "/salon/creer",
    label: "Créer un salon",
    description: "Obtenez un code d'invitation et attendez vos amis",
    icon: DoorOpen,
  },
  {
    href: "/salon/rejoindre",
    label: "Rejoindre un salon",
    description: "Saisissez un code pour rejoindre une partie",
    icon: KeyRound,
  },
  {
    href: "/regles",
    label: "Règles du jeu",
    description: "Guide illustré des règles configurées",
    icon: BookOpenText,
  },
];

export function MainMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const setMusicEnabled = useSettingsStore((s) => s.setMusicEnabled);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-16 grain-overlay">
      <SceneBackground />

      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
        <button
          aria-label={musicEnabled ? "Couper la musique" : "Activer la musique"}
          onClick={() => setMusicEnabled(!musicEnabled)}
          className="rounded-full p-2.5 bg-navy-900/50 border border-gold-500/20 text-ivory-100/80 hover:text-gold-300 hover:border-gold-400/40 transition-colors cursor-pointer"
        >
          {musicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          aria-label="Paramètres"
          onClick={() => setSettingsOpen(true)}
          className="rounded-full p-2.5 bg-navy-900/50 border border-gold-500/20 text-ivory-100/80 hover:text-gold-300 hover:border-gold-400/40 transition-colors cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center mb-14"
      >
        <span className="font-sans text-xs tracking-[0.35em] uppercase text-gold-400/80 mb-3">
          Édition en ligne
        </span>
        <h1>
          <Logo />
        </h1>
        <p className="mt-4 font-sans text-ivory-200/60 text-sm sm:text-base max-w-md">
          Chaque mois compte. Chaque décision aussi.
        </p>
      </motion.div>

      <motion.nav
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
        }}
        className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl"
        aria-label="Menu principal"
      >
        {menuItems.map(({ href, label, description, icon: Icon }) => (
          <motion.div
            key={href}
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Link href={href} className="block group">
              <motion.div
                whileHover={{ y: -3 }}
                whileTap={{ y: 0, scale: 0.985 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="h-full rounded-2xl border border-gold-500/20 bg-navy-900/55 backdrop-blur-sm px-5 py-5 flex items-start gap-4 group-hover:border-gold-400/50 group-hover:bg-navy-900/75 transition-colors shadow-[var(--shadow-soft)]"
              >
                <span className="shrink-0 rounded-xl p-2.5 surface-gold">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <span className="text-left">
                  <span className="block font-display font-medium text-lg text-ivory-50">
                    {label}
                  </span>
                  <span className="block font-sans text-sm text-ivory-200/55 mt-0.5">
                    {description}
                  </span>
                </span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.nav>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="relative z-10 mt-10 font-sans text-xs tracking-[0.2em] uppercase text-ivory-200/40"
      >
        2 à 6 joueurs · 3 mois de jeu · Parties privées
      </motion.p>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
