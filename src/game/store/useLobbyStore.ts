"use client";

/**
 * Salon multijoueur RÉEL : parle à un petit serveur WebSocket (voir
 * `server.mjs`, monté sur `/ws`), qui garde l'état des salons en mémoire
 * côté serveur et le diffuse à tous les appareils connectés au même code.
 *
 * Ça fonctionne entre appareils différents (pas seulement entre onglets du
 * même navigateur), tant que le serveur déployé exécute bien `server.mjs`
 * (voir package.json : "start"). ⚠️ État en mémoire seulement : un
 * redémarrage du serveur efface les salons en cours — ce n'est pas encore
 * une persistance en base de données.
 */

import { create } from "zustand";

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
  connected: boolean;
  createLobby: (hostName: string, maxPlayers: number) => Promise<{ ok: true; code: string } | { ok: false; error: JoinError }>;
  joinLobby: (code: string, name: string) => Promise<{ ok: true } | { ok: false; error: JoinError }>;
  leaveLobby: () => void;
  startGame: () => void;
  reset: () => void;
}

type ServerMessage =
  | { type: "created"; code: string; playerId: string; lobby: LobbyState }
  | { type: "joined"; code: string; playerId: string; lobby: LobbyState }
  | { type: "lobby"; lobby: LobbyState }
  | { type: "error"; message: JoinError };

let socket: WebSocket | null = null;
let connecting: Promise<WebSocket> | null = null;
let pending: { resolve: (msg: ServerMessage) => void; reject: (err: Error) => void } | null = null;

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

function handleMessage(msg: ServerMessage) {
  if (msg.type === "created" || msg.type === "joined") {
    useLobbyStore.setState({ lobby: msg.lobby, myPlayerId: msg.playerId });
    pending?.resolve(msg);
    pending = null;
    return;
  }
  if (msg.type === "lobby") {
    const current = useLobbyStore.getState().lobby;
    if (current && current.code === msg.lobby.code) {
      useLobbyStore.setState({ lobby: msg.lobby });
    }
    return;
  }
  if (msg.type === "error") {
    pending?.reject(new Error(msg.message));
    pending = null;
  }
}

function connect(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(wsUrl());

    ws.addEventListener("open", () => {
      socket = ws;
      useLobbyStore.setState({ connected: true });
      connecting = null;
      resolve(ws);
    });

    ws.addEventListener("message", (event) => {
      try {
        handleMessage(JSON.parse(event.data as string) as ServerMessage);
      } catch {
        // message illisible, ignoré
      }
    });

    ws.addEventListener("close", () => {
      if (socket === ws) socket = null;
      useLobbyStore.setState({ connected: false });
    });

    ws.addEventListener("error", () => {
      connecting = null;
      reject(new Error("connection"));
    });
  });

  return connecting;
}

function send(payload: Record<string, unknown>) {
  socket?.send(JSON.stringify(payload));
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobby: null,
  myPlayerId: null,
  connected: false,

  createLobby: async (hostName, maxPlayers) => {
    try {
      const ws = await connect();
      const msg = await new Promise<ServerMessage>((resolve, reject) => {
        pending = { resolve, reject };
        ws.send(JSON.stringify({ type: "create", hostName, maxPlayers }));
      });
      if (msg.type === "created") return { ok: true, code: msg.code };
      return { ok: false, error: "unknown" };
    } catch {
      return { ok: false, error: "connection" };
    }
  },

  joinLobby: async (code, name) => {
    try {
      const ws = await connect();
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
    send({ type: "leave" });
    set({ lobby: null, myPlayerId: null });
  },

  startGame: () => {
    send({ type: "start" });
  },

  reset: () => set({ lobby: null, myPlayerId: null }),
}));
