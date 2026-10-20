"use client";

/**
 * Connexion WebSocket partagée (une seule par onglet), utilisée à la fois par
 * le salon (useLobbyStore) et par la partie (useGameStore) — le serveur
 * associe le code de salon et l'identifiant du joueur à CETTE connexion, donc
 * les deux stores doivent parler sur le même socket plutôt que d'en ouvrir un
 * chacun.
 */

export type ServerMessage = Record<string, unknown> & { type: string };

type Handler = (msg: ServerMessage) => void;

let socket: WebSocket | null = null;
let connecting: Promise<WebSocket> | null = null;
const listeners = new Set<Handler>();

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function connectSocket(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(wsUrl());

    ws.addEventListener("open", () => {
      socket = ws;
      connecting = null;
      resolve(ws);
    });

    ws.addEventListener("message", (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        return;
      }
      listeners.forEach((fn) => fn(msg));
    });

    ws.addEventListener("close", () => {
      if (socket === ws) socket = null;
    });

    ws.addEventListener("error", () => {
      connecting = null;
      reject(new Error("connection"));
    });
  });

  return connecting;
}

/** S'abonne aux messages entrants. Retourne une fonction de désabonnement. */
export function onMessage(handler: Handler): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function sendMessage(payload: Record<string, unknown>) {
  socket?.send(JSON.stringify(payload));
}

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
