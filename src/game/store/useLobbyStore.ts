"use client";

/**
 * Salon multijoueur RÉEL : parle à un petit serveur WebSocket (voir
 * `server.ts`, monté sur `/ws`), qui garde l'état des salons en mémoire
 * côté serveur et le diffuse à tous les appareils connectés au même code.
 *
 * Ça fonctionne entre appareils différents (pas seulement entre onglets du
 * même navigateur), tant que le serveur déployé exécute bien `server.ts`
 * (voir package.json : "start"). ⚠️ État en mémoire seulement : un
 * redémarrage du serveur efface les salons en cours — ce n'est pas encore
 * une persistance en base de données.
 */

import { create } from "zustand";
import { connectSocket, onMessage, sendMessage, type ServerMessage } from "@/lib/realtime/socket";

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

export type JoinError = "not-found" | "full" | "started" | "connection" | "unknown";

interface LobbyStore {
  lobby: LobbyState | null;
  myPlayerId: string | null;
  createLobby: (hostName: string, maxPlayers: number) => Promise<{ ok: true; code: string } | { ok: false; error: JoinError }>;
  joinLobby: (code: string, name: string) => Promise<{ ok: true } | { ok: false; error: JoinError }>;
  leaveLobby: () => void;
  startGame: () => void;
  reset: () => void;
}

let pending: { resolve: (msg: ServerMessage) => void; reject: (err: Error) => void } | null = null;

onMessage((msg) => {
  if (msg.type === "created" || msg.type === "joined") {
    useLobbyStore.setState({ lobby: msg.lobby as LobbyState, myPlayerId: msg.playerId as string });
    pending?.resolve(msg);
    pending = null;
    return;
  }
  if (msg.type === "lobby") {
    const current = useLobbyStore.getState().lobby;
    const incoming = msg.lobby as LobbyState;
    if (current && current.code === incoming.code) {
      useLobbyStore.setState({ lobby: incoming });
    }
    return;
  }
  if (msg.type === "error") {
    pending?.reject(new Error(msg.message as string));
    pending = null;
  }
});

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobby: null,
  myPlayerId: null,

  createLobby: async (hostName, maxPlayers) => {
    try {
      const ws = await connectSocket();
      const msg = await new Promise<ServerMessage>((resolve, reject) => {
        pending = { resolve, reject };
        ws.send(JSON.stringify({ type: "create", hostName, maxPlayers }));
      });
      if (msg.type === "created") return { ok: true, code: msg.code as string };
      return { ok: false, error: "unknown" };
    } catch {
      return { ok: false, error: "connection" };
    }
  },

  joinLobby: async (code, name) => {
    try {
      const ws = await connectSocket();
      await new Promise<ServerMessage>((resolve, reject) => {
        pending = { resolve, reject };
        ws.send(JSON.stringify({ type: "join", code: code.toUpperCase(), name }));
      });
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown";
      const error: JoinError = ["not-found", "full", "started"].includes(message)
        ? (message as JoinError)
        : "connection";
      return { ok: false, error };
    }
  },

  leaveLobby: () => {
    sendMessage({ type: "leave" });
    set({ lobby: null, myPlayerId: null });
  },

  startGame: () => {
    sendMessage({ type: "start" });
  },

  reset: () => set({ lobby: null, myPlayerId: null }),
}));
