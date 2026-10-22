import type { PlayerTokenId } from "@/game/engine/types";
import { TOKEN_COLORS } from "@/game/tokenPalette";

const TOKEN_GLYPHS: Record<PlayerTokenId, { path: string; viewBox: string }> = {
  "piece-or": {
    viewBox: "0 0 24 24",
    path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.2a6.8 6.8 0 110 13.6 6.8 6.8 0 010-13.6zM12 7a1 1 0 011 1v.1c1.3.3 2.2 1.1 2.2 2.3 0 .6-.4 1-1 1s-1-.4-1-1c0-.4-.5-.8-1.2-.8s-1.2.4-1.2.8c0 .4.3.6 1.4 1 1.5.5 2.4 1.1 2.4 2.5 0 1.3-1 2.2-2.2 2.5v.1a1 1 0 01-2 0v-.1c-1.3-.3-2.2-1.1-2.2-2.3 0-.6.4-1 1-1s1 .4 1 1c0 .4.5.8 1.2.8s1.2-.4 1.2-.8c0-.4-.3-.6-1.4-1-1.5-.5-2.4-1.1-2.4-2.5 0-1.3 1-2.2 2.2-2.5V8a1 1 0 011-1z",
  },
  "porte-monnaie": {
    viewBox: "0 0 24 24",
    path: "M4 7a2 2 0 012-2h10a3 3 0 013 3v1h1a1 1 0 011 1v6a1 1 0 01-1 1h-1a3 3 0 01-3 3H6a2 2 0 01-2-2V7zm2 0v11h10a1 1 0 001-1V8a1 1 0 00-1-1H6zm12 4.5h1.5v2H18a1 1 0 010-2z",
  },
  cle: {
    viewBox: "0 0 24 24",
    path: "M14.5 2a6.5 6.5 0 00-6.3 8.1L2 16.3V20a1 1 0 001 1h3.7a1 1 0 00.7-.3l1-1a1 1 0 00.3-.7v-1h1a1 1 0 001-1v-1h1a1 1 0 00.7-.3l.4-.4A6.5 6.5 0 1014.5 2zm2 4a2 2 0 110 4 2 2 0 010-4z",
  },
  horloge: {
    viewBox: "0 0 24 24",
    path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a1 1 0 011 1v5.6l3.6 2.1a1 1 0 11-1 1.7l-4.1-2.4a1 1 0 01-.5-.9V6a1 1 0 011-1z",
  },
  valise: {
    viewBox: "0 0 24 24",
    path: "M9 2a2 2 0 00-2 2v1H5a3 3 0 00-3 3v8a3 3 0 003 3h14a3 3 0 003-3V8a3 3 0 00-3-3h-2V4a2 2 0 00-2-2H9zm0 3V4h6v1H9zM4 11h16v2H4v-2z",
  },
  trefle: {
    viewBox: "0 0 24 24",
    path: "M12 2a3.5 3.5 0 00-3 5.3A3.5 3.5 0 105.3 12a3.5 3.5 0 003 5.3A3.5 3.5 0 0012 20a3.5 3.5 0 003.7-2.7 3.5 3.5 0 003-5.3 3.5 3.5 0 00-3.7-7A3.5 3.5 0 0012 2z",
  },
};

/** Pion en véritable silhouette (socle + fût + tête), pas une simple bille plate. */
export function PlayerToken({
  tokenId,
  size = 28,
  ring,
  hopKey = 0,
}: {
  tokenId: PlayerTokenId;
  size?: number;
  ring?: boolean;
  /** Change à chaque pas de déplacement : relance un petit saut synchronisé pion/ombre. */
  hopKey?: number;
}) {
  const glyph = TOKEN_GLYPHS[tokenId];
  const { light, mid, dark, darker } = TOKEN_COLORS[tokenId];
  const gradId = `ejdp-pawn-${tokenId}`;
  const headId = `ejdp-head-${tokenId}`;
  const w = size;
  const h = size * 1.5;

  return (
    <div className="relative shrink-0" style={{ width: w, height: h }}>
      {/* Ombre portée au sol — se contracte pendant le saut */}
      <div
        key={`shadow-${hopKey}`}
        className="absolute rounded-full ejdp-shadow-hop"
        style={{
          width: w * 0.8,
          height: w * 0.24,
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(6,10,18,0.45), transparent 75%)",
        }}
      />

      {/* Halo doré du joueur actif */}
      {ring && (
        <div
          className="absolute rounded-full"
          style={{
            inset: -w * 0.22,
            bottom: w * 0.18,
            background: "radial-gradient(circle, rgba(212,175,122,0.4), transparent 70%)",
          }}
        />
      )}

      <svg
        key={`pawn-${hopKey}`}
        viewBox="0 0 40 60"
        width={w}
        height={h}
        className="absolute left-1/2 bottom-0 ejdp-pawn-hop"
        style={{ transform: "translateX(-50%)", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={light} />
            <stop offset="42%" stopColor={mid} />
            <stop offset="78%" stopColor={dark} />
            <stop offset="100%" stopColor={darker} />
          </linearGradient>
          <radialGradient id={headId} cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="10%" stopColor={light} />
            <stop offset="45%" stopColor={mid} />
            <stop offset="80%" stopColor={dark} />
            <stop offset="100%" stopColor={darker} />
          </radialGradient>
          <filter id="ejdp-pawn-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#06240f" floodOpacity="0.45" />
          </filter>
        </defs>

        <g filter="url(#ejdp-pawn-shadow)">
          {/* Socle */}
          <ellipse cx={20} cy={54} rx={13} ry={4.5} fill={`url(#${gradId})`} stroke={darker} strokeOpacity={0.35} strokeWidth={0.6} />
          <path d="M9 54 L12 42 Q20 44 28 42 L31 54 Z" fill={`url(#${gradId})`} />
          {/* Fût */}
          <path
            d="M13.5 42 L16.5 25 Q20 27 23.5 25 L26.5 42 Q20 44.5 13.5 42 Z"
            fill={`url(#${gradId})`}
          />
          {/* Collerette */}
          <ellipse cx={20} cy={24.5} rx={6.4} ry={2.6} fill={dark} opacity={0.9} />
          {/* Tête */}
          <circle cx={20} cy={14} r={10} fill={`url(#${headId})`} stroke={darker} strokeOpacity={0.25} strokeWidth={0.5} />
          {/* Reflet spéculaire sur la tête */}
          <ellipse cx={15.5} cy={9.5} rx={3.2} ry={2} fill="#ffffff" opacity={0.75} transform="rotate(-20 15.5 9.5)" />

          {/* Icône du joueur, gravée sur la tête du pion */}
          <g transform="translate(20 14) scale(0.46) translate(-12 -12)" opacity={0.85}>
            <path d={glyph.path} fill={darker} />
          </g>
        </g>
      </svg>
    </div>
  );
}
