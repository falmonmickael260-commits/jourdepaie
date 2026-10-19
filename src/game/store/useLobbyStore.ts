"use client";

/**
 * ⚠️ Salon LOCAL (navigateur courant uniquement). Le code d'invitation est
 * généré côté client et n'est connu d'aucun serveur : il ne peut donc pas
 * encore être utilisé par un autre appareil pour rejoindre la même partie.
 * Le vrai salon multijoueur nécessite Supabase Realtime (voir supabase/README.md).
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
  createLobby: (hostName: string, maxPlayers: number) => string;
  joinLobby: (code: string, name: string) => boolean;
  leaveLobby: (playerId: string) => void;
  startGame: () => void;
  reset: () => void;
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  lobby: null,

  createLobby: (hostName, maxPlayers) => {
    const code = generateCode();
    set({
      lobby: {
        code,
        maxPlayers,
        players: [{ id: nanoid(8), name: hostName, isHost: true, connected: true }],
        started: false,
      },
    });
    return code;
  },

  joinLobby: (code, name) => {
    const current = get().lobby;
    if (!current || current.code !== code) {
      // Démo locale : si aucun salon local ne correspond, on en recrée un
      // pour que le parcours reste testable sans backend.
      set({
        lobby: {
          code,
          maxPlayers: 6,
          players: [{ id: nanoid(8), name, isHost: true, connected: true }],
          started: false,
        },
      });
      return true;
    }
    if (current.players.length >= current.maxPlayers || current.started) return false;
    set({
      lobby: {
        ...current,
        players: [...current.players, { id: nanoid(8), name, isHost: false, connected: true }],
      },
    });
    return true;
  },

  leaveLobby: (playerId) => {
    const current = get().lobby;
    if (!current) return;
    set({ lobby: { ...current, players: current.players.filter((p) => p.id !== playerId) } });
  },

  startGame: () => {
    const current = get().lobby;
    if (!current || current.players.length < 2) return;
    set({ lobby: { ...current, started: true } });
  },

  reset: () => set({ lobby: null }),
}));
