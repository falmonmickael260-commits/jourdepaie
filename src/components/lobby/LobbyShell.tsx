import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SceneBackground } from "@/components/menu/SceneBackground";

export function LobbyShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 grain-overlay">
      <SceneBackground />

      <Link
        href="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-ivory-100/70 hover:text-gold-300 text-sm font-sans transition-colors"
      >
        <ArrowLeft size={16} /> Menu principal
      </Link>

      <div className="relative z-10 w-full max-w-md surface-card grain-overlay rounded-2xl p-7 sm:p-8 shadow-[var(--shadow-lifted)]">
        <h1 className="font-display text-2xl sm:text-3xl text-navy-900 mb-1">{title}</h1>
        {subtitle && <p className="font-sans text-sm text-navy-800/60 mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </main>
  );
}
