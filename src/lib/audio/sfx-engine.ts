/**
 * Moteur audio synthétisé (Web Audio API).
 *
 * Aucun fichier audio externe n'est utilisé : tous les effets sont générés
 * procéduralement, pour rester fonctionnels sans dépendre d'assets sous
 * licence à fournir séparément. Un vrai habillage sonore (musique d'ambiance,
 * SFX designés) pourra remplacer ce moteur sans changer son interface publique
 * (`playSfx`, `setMusicEnabled`, ...).
 */

type SfxName =
  | "click"
  | "dice-roll"
  | "card-flip"
  | "payment"
  | "gain"
  | "month-end"
  | "victory";

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

function tone(
  ctx: AudioContext,
  { freq, start, duration, type = "sine", gain = 0.15 }: {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
  }
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.02);
}

function noiseBurst(ctx: AudioContext, { start, duration, gain = 0.1 }: { start: number; duration: number; gain?: number }) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, ctx.currentTime + start);
  source.connect(g).connect(ctx.destination);
  source.start(ctx.currentTime + start);
}

const sequences: Record<SfxName, (ctx: AudioContext, volume: number) => void> = {
  click: (ctx, v) => tone(ctx, { freq: 880, start: 0, duration: 0.05, type: "triangle", gain: 0.1 * v }),
  "dice-roll": (ctx, v) => {
    for (let i = 0; i < 5; i++) {
      noiseBurst(ctx, { start: i * 0.08, duration: 0.05, gain: 0.08 * v });
    }
  },
  "card-flip": (ctx, v) => {
    tone(ctx, { freq: 520, start: 0, duration: 0.08, type: "sine", gain: 0.08 * v });
    tone(ctx, { freq: 700, start: 0.05, duration: 0.07, type: "sine", gain: 0.06 * v });
  },
  payment: (ctx, v) => {
    tone(ctx, { freq: 300, start: 0, duration: 0.18, type: "sawtooth", gain: 0.09 * v });
    tone(ctx, { freq: 220, start: 0.08, duration: 0.2, type: "sawtooth", gain: 0.07 * v });
  },
  gain: (ctx, v) => {
    tone(ctx, { freq: 660, start: 0, duration: 0.12, type: "sine", gain: 0.1 * v });
    tone(ctx, { freq: 880, start: 0.08, duration: 0.16, type: "sine", gain: 0.1 * v });
    tone(ctx, { freq: 1100, start: 0.16, duration: 0.2, type: "sine", gain: 0.09 * v });
  },
  "month-end": (ctx, v) => {
    [523, 659, 784].forEach((freq, i) =>
      tone(ctx, { freq, start: i * 0.12, duration: 0.3, type: "triangle", gain: 0.08 * v })
    );
  },
  victory: (ctx, v) => {
    [523, 659, 784, 1047].forEach((freq, i) =>
      tone(ctx, { freq, start: i * 0.14, duration: 0.4, type: "triangle", gain: 0.1 * v })
    );
  },
};

export function playSfx(name: SfxName, volume: number) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  sequences[name](ctx, Math.max(0, Math.min(1, volume)));
}

/** À appeler une fois après une interaction utilisateur (politique autoplay des navigateurs). */
export function unlockAudio() {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}
