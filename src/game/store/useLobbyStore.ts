"use client";

/**
 * Salon partagé entre onglets/fenêtres d'un même navigateur, via
 * localStorage + BroadcastChannel (synchrone, sans serveur). Cela permet de
 * tester réellement "créer d'un côté / rejoindre de l'autre" sur un seul
 * ordinateur (deux onglets).
 *
 * ⚠️ Cela reste local à CET ordinateur. Pour qu'une autre personne, sur un
 * autre appareil, rejoigne réellement la partie par le code, il faut un vrai
 * serveur (Supabase Realtime — voir supabase/README.md). Sans ça, deux
 * appareils différents ne peuvent pas se voir : ce n'est pas encore branché.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export interface LobbyState {
  code: string | null;
  maxPlayers: number;
  players: LobbyPlayer[];
  started: boolean;
}

interface LobbyStore {
  lobby: LobbyState | null;
  /** Identifiant du joueur local dans CET onglet (pour "Quitter", distinguer "soi" des autres). */
  myPlayerId: string | null;
  createLobby: (hostName: string, maxPlayers: number) => string;
  joinLobby: (code: string, name: string) => boolean;
  leaveLobby: () => void;
  startGame: () => void;
  reset: () => void;
}

const STORAGE_PREFIX = "ejdp-lobby-";
const CHANNEL_NAME = "ejdp-lobby-sync";

function generateCode(): string {
  // Pas de 0/O/1/I/L pour rester lisible à l'oral comme à l'écrit.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function readPersisted(code: string): LobbyState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + code);
    return raw ? (JSON.parse(raw) as LobbyState) : null;
  } catch {
    return null;
  }
}

function persist(lobby: LobbyState) {
  if (typeof window === "undefined" || !lobby.code) return;
  window.localStorage.setItem(STORAGE_PREFIX + lobby.code, JSON.stringify(lobby));
  getChannel()?.postMessage({ code: lobby.code });
}

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export const useLobbyStore = create<LobbyStore>((set, get) => {
  if (typeof window !== "undefined") {
    getChannel()?.addEventListener("message", (event: MessageEvent<{ code: string }>) => {
      const current = get().lobby;
      if (!current || current.code !== event.data?.code) return;
      const fresh = readPersisted(current.code);
      if (fresh) set({ lobby: fresh });
    });
  }

  return {
    lobby: null,
    myPlayerId: null,

    createLobby: (hostName, maxPlayers) => {
      const code = generateCode();
      const hostId = nanoid(8);
      const lobby: LobbyState = {
        code,
        maxPlayers,
        players: [{ id: hostId, name: hostName, isHost: true, connected: true }],
        started: false,
      };
      set({ lobby, myPlayerId: hostId });
      persist(lobby);
      return code;
    },

    joinLobby: (code, name) => {
      const existing = readPersisted(code);

      if (!existing) {
        // Aucun salon trouvé sous ce code sur cet ordinateur : on ne peut pas
        // deviner une partie qui n'existe pas. On signale l'échec plutôt que
        // de fabriquer silencieusement un salon vide (ancien bug : ça créait
        // une pièce isolée et affichait "rejoint" alors que non).
        return false;
      }
      if (existing.players.length >= existing.maxPlayers || existing.started) return false;

      const playerId = nanoid(8);
      const lobby: LobbyState = {
        ...existing,
        players: [...existing.players, { id: playerId, name, isHost: false, connected: true }],
      };
      set({ lobby, myPlayerId: playerId });
      persist(lobby);
      return true;
    },

    leaveLobby: () => {
      const current = get().lobby;
      const myId = get().myPlayerId;
      if (!current) return;
      const lobby: LobbyState = { ...current, players: current.players.filter((p) => p.id !== myId) };
      persist(lobby);
      set({ lobby: null, myPlayerId: null });
    },

    startGame: () => {
      const current = get().lobby;
      if (!current || current.players.length < 2) return;
      const lobby: LobbyState = { ...current, started: true };
      set({ lobby });
      persist(lobby);
    },

    reset: () => set({ lobby: null, myPlayerId: null }),
  };
});
