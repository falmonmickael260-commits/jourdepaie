import { cn } from "@/lib/utils";

/**
 * Logotype "EN JOUR DE PAIE" — lettrage doré gravé plutôt qu'un simple texte
 * italique plat. Composition et palette entièrement originales (émeraude /
 * or / ivoire) : gradient or + contour bronze + ombre portée, pour un rendu
 * "métal embouti" qui reste lisible sur fond sombre comme sur fond clair —
 * sans reprendre la mise en scène d'une référence externe.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("relative inline-flex flex-col items-center select-none", className)}>
      {!compact && (
        <svg viewBox="0 0 60 20" className="w-14 mb-1" aria-hidden>
          <path d="M30 2 L33 9 L30 7 L27 9 Z" fill="url(#ejdp-logo-gold)" />
          <path d="M4 16 Q30 2 56 16" stroke="url(#ejdp-logo-gold)" strokeWidth={1.1} fill="none" strokeLinecap="round" />
          <circle cx={4} cy={16} r={1.6} fill="#d4af7a" />
          <circle cx={56} cy={16} r={1.6} fill="#d4af7a" />
          <defs>
            <linearGradient id="ejdp-logo-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2e3bd" />
              <stop offset="55%" stopColor="#d4af7a" />
              <stop offset="100%" stopColor="#8f6c3b" />
            </linearGradient>
          </defs>
        </svg>
      )}

      <span
        className={cn("font-display font-bold tracking-tight leading-[0.95]", compact ? "text-lg" : "text-5xl sm:text-7xl")}
        style={{
          backgroundImage:
            "linear-gradient(180deg, #faf2dc 0%, #f2e3bd 20%, #d4af7a 52%, #b38a52 78%, #8f6c3b 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: compact ? "0.6px #5c3d1a" : "1.4px #5c3d1a",
          filter: compact
            ? "drop-shadow(0 1px 1px rgba(6,36,24,0.4))"
            : "drop-shadow(0 2px 2px rgba(6,36,24,0.45)) drop-shadow(0 6px 14px rgba(6,36,24,0.3))",
        }}
      >
        En jour de <em>paie</em>
      </span>
    </span>
  );
}
