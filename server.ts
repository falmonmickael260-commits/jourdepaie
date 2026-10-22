// Serveur personnalisé : sert l'application Next.js ET un petit serveur
// WebSocket (salon + partie multijoueur) sur le MÊME process/port —
// nécessaire pour un hébergeur à process persistant comme Railway
// (contrairement à une plateforme serverless, qui ne garde pas de
// connexions WebSocket ouvertes).
//
// Le serveur est désormais AUSSI l'autorité du moteur de jeu une fois la
// partie lancée : il fait tourner le même moteur que le client
// (src/game/engine, src/game/rules) et diffuse l'état à tous les appareils
// du salon. C'est ce qui garantit que deux appareils voient exactement le
// même dé/la même carte, et que seul le joueur actif puisse agir.
//
// ⚠️ État des salons/parties en mémoire uniquement : si le process
// redémarre, tout est perdu. Suffisant pour une démo multijoueur simple ;
// pas une base de données persistante.

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import next from "next";
import { WebSocketServer, type WebSocket } from "ws";

import { reduceGame } from "./src/game/engine/state-machine";
import { resolveCardEffect } from "./src/game/engine/resolve-card";
import { economyRules, buildDraftBoardLayout, pickCardForTile } from "./src/game/rules/edition-2024";
import type { GameState, PlayerTokenId } from "./src/game/engine/types";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

interface Room {
  code: string;
  maxPlayers: number;
  players: LobbyPlayer[];
  started: boolean;
  sockets: Map<string, WebSocket>;
  game: GameState | null;
  rollTimer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TOKENS: PlayerTokenId[] = ["piece-or", "porte-monnaie", "cle", "horloge", "valise", "trefle"];

function generateCode(): string {
  let code: string;
  do {
    code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function publicRoom(room: Room) {
  return { code: room.code, maxPlayers: room.maxPlayers, players: room.players, started: room.started };
}

function broadcast(room: Room, message: Record<string, unknown>) {
  const payload = JSON.stringify(message);
  for (const socket of room.sockets.values()) {
    if (socket.readyState === socket.OPEN) socket.send(payload);
  }
}

function send(ws: WebSocket, message: Record<string, unknown>) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcastGame(room: Room) {
  if (room.game) broadcast(room, { type: "game", game: room.game });
}

/** Construit la partie à partir des joueurs du salon, en réutilisant leurs identifiants tels quels. */
function buildInitialGame(room: Room): GameState {
  const board = buildDraftBoardLayout(economyRules.daysPerMonth.value);
  return {
    gameId: randomUUID(),
    rulesetVersion: "edition-2024-configurable-draft",
    phase: "awaiting-roll",
    month: 1,
    day: 1,
    activePlayerIndex: 0,
    players: room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      tokenId: TOKENS[i % TOKENS.length],
      position: 0,
      account: {
        cash: economyRules.startingCash.value,
        savings: 0,
        debt: 0,
        investments: 0,
      },
      connected: p.connected,
    })),
    board,
    lastRoll: null,
    activeCard: null,
    transactions: [],
    log: [{ id: randomUUID(), message: "Partie en réseau initialisée.", at: new Date().toISOString() }],
  };
}

function activePlayerId(room: Room): string | undefined {
  return room.game?.players[room.game.activePlayerIndex]?.id;
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });
  const nextUpgradeHandler = typeof app.getUpgradeHandler === "function" ? app.getUpgradeHandler() : null;

  server.on("upgrade", (req, socket, head) => {
    let pathname = "/";
    try {
      pathname = new URL(req.url ?? "/", `http://${req.headers.host}`).pathname;
    } catch {
      // ignore, garde "/"
    }
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else if (nextUpgradeHandler) {
      nextUpgradeHandler(req, socket, head);
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    let joinedCode: string | null = null;
    let playerId: string | null = null;

    ws.on("message", (raw: Buffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // --- Salon ---------------------------------------------------------

      if (msg.type === "create") {
        const code = generateCode();
        playerId = randomUUID();
        joinedCode = code;
        const room: Room = {
          code,
          maxPlayers: Math.min(6, Math.max(2, Number(msg.maxPlayers) || 4)),
          players: [{ id: playerId, name: String(msg.hostName || "Hôte").slice(0, 20), isHost: true, connected: true }],
          started: false,
          sockets: new Map([[playerId, ws]]),
          game: null,
          rollTimer: null,
        };
        rooms.set(code, room);
        send(ws, { type: "created", code, playerId, lobby: publicRoom(room) });
        return;
      }

      if (msg.type === "join") {
        const room = rooms.get(String(msg.code || "").toUpperCase());
        if (!room) {
          send(ws, { type: "error", message: "not-found" });
          return;
        }
        if (room.started) {
          send(ws, { type: "error", message: "started" });
          return;
        }
        if (room.players.length >= room.maxPlayers) {
          send(ws, { type: "error", message: "full" });
          return;
        }
        playerId = randomUUID();
        joinedCode = room.code;
        room.players.push({ id: playerId, name: String(msg.name || "Joueur").slice(0, 20), isHost: false, connected: true });
        room.sockets.set(playerId, ws);
        send(ws, { type: "joined", code: room.code, playerId, lobby: publicRoom(room) });
        broadcast(room, { type: "lobby", lobby: publicRoom(room) });
        return;
      }

      if (msg.type === "leave") {
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room) return;
        room.players = room.players.filter((p) => p.id !== playerId);
        room.sockets.delete(playerId!);
        if (room.players.length === 0) {
          rooms.delete(room.code);
        } else {
          if (!room.players.some((p) => p.isHost)) room.players[0].isHost = true;
          broadcast(room, { type: "lobby", lobby: publicRoom(room) });
        }
        joinedCode = null;
        playerId = null;
        return;
      }

      if (msg.type === "start") {
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room) return;
        const me = room.players.find((p) => p.id === playerId);
        if (!me?.isHost || room.players.length < 2 || room.started) return;
        room.started = true;
        room.game = buildInitialGame(room);
        broadcast(room, { type: "lobby", lobby: publicRoom(room) });
        broadcastGame(room);
        return;
      }

      // --- Partie (une fois lancée) --------------------------------------

      if (msg.type === "request_game") {
        // La page de partie demande explicitement l'état courant au montage
        // (plutôt que de compter sur la diffusion unique faite au moment du
        // "start", qui a pu être émise avant même que cette page — et son
        // écouteur de messages — n'existe : le salon et la partie ne
        // partagent pas le même code JS, donc le même connexion WebSocket
        // peut recevoir un message avant que le bon store ne soit chargé).
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (room?.game) send(ws, { type: "game", game: room.game });
        return;
      }

      if (msg.type === "roll") {
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room?.game) return;
        if (room.game.phase !== "awaiting-roll") return;
        if (playerId !== activePlayerId(room)) return; // seul le joueur actif peut lancer
        if (room.rollTimer) return; // lancer déjà en cours

        broadcast(room, { type: "rolling" });
        room.rollTimer = setTimeout(() => {
          room.rollTimer = null;
          const dice: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
          room.game = reduceGame(room.game!, { type: "ROLL_DICE", dice });
          broadcastGame(room);
        }, 900);
        return;
      }

      if (msg.type === "ack_move") {
        // Signal "mon animation de déplacement est terminée" — accepté de
        // n'importe quel appareil connecté (chacun voit le même déplacement
        // au même moment) ; idempotent car la phase change dès la première
        // prise en compte.
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room?.game || room.game.phase !== "moving") return;
        room.game = reduceGame(room.game, { type: "ACK_MOVE_COMPLETE" });
        room.game = reduceGame(room.game, { type: "RESOLVE_TILE" });
        if (room.game.phase === "awaiting-card-decision") {
          const tile = room.game.board[room.game.players[room.game.activePlayerIndex].position];
          room.game = { ...room.game, activeCard: pickCardForTile(tile.type) };
        }
        broadcastGame(room);
        return;
      }

      if (msg.type === "choose_card") {
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room?.game) return;
        if (room.game.phase !== "awaiting-card-decision" || !room.game.activeCard) return;
        if (playerId !== activePlayerId(room)) return;
        const optionIndex = Number(msg.optionIndex) || 0;
        const resolved = resolveCardEffect(room.game, room.game.activeCard, optionIndex);
        room.game = reduceGame(resolved, { type: "RESOLVE_CARD_CHOICE", optionIndex });
        broadcastGame(room);
        return;
      }

      if (msg.type === "end_turn") {
        const room = joinedCode ? rooms.get(joinedCode) : undefined;
        if (!room?.game) return;
        if (room.game.phase !== "turn-end") return;
        if (playerId !== activePlayerId(room)) return;
        let next = reduceGame(room.game, { type: "END_TURN" });
        if (next.phase === "month-end") {
          next = reduceGame(next, { type: "ADVANCE_MONTH" });
        }
        room.game = next;
        broadcastGame(room);
        return;
      }
    });

    ws.on("close", () => {
      const room = joinedCode ? rooms.get(joinedCode) : undefined;
      if (!room) return;
      const me = room.players.find((p) => p.id === playerId);
      if (me) {
        me.connected = false;
        room.sockets.delete(playerId!);
        broadcast(room, { type: "lobby", lobby: publicRoom(room) });
      }
      if (room.game) {
        room.game = {
          ...room.game,
          players: room.game.players.map((p) => (p.id === playerId ? { ...p, connected: false } : p)),
        };
        broadcastGame(room);
      }
    });
  });

  server.listen(port, () => {
    console.log(`> En jour de paie prêt sur le port ${port} (${dev ? "dev" : "production"})`);
  });
});
