// Serveur personnalisé : sert l'application Next.js ET un petit serveur
// WebSocket (salon multijoueur) sur le MÊME process/port — nécessaire pour
// un hébergeur à process persistant comme Railway (contrairement à une
// plateforme serverless, qui ne garde pas de connexions WebSocket ouvertes).
//
// ⚠️ État des salons en mémoire uniquement : si le process redémarre, les
// salons en cours sont perdus. Suffisant pour une démo multijoueur simple ;
// pas une base de données persistante.

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import next from "next";
import { WebSocketServer } from "ws";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

/** code -> { code, maxPlayers, players: [{id,name,isHost,connected}], started, sockets: Map<playerId, ws> } */
const rooms = new Map();

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function publicRoom(room) {
  return { code: room.code, maxPlayers: room.maxPlayers, players: room.players, started: room.started };
}

function broadcast(room, message) {
  const payload = JSON.stringify(message);
  for (const socket of room.sockets.values()) {
    if (socket.readyState === socket.OPEN) socket.send(payload);
  }
}

function send(ws, message) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });
  const nextUpgradeHandler = typeof app.getUpgradeHandler === "function" ? app.getUpgradeHandler() : null;

  server.on("upgrade", (req, socket, head) => {
    let pathname = "/";
    try {
      pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    } catch {
      // ignore, garde "/"
    }
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else if (nextUpgradeHandler) {
      nextUpgradeHandler(req, socket, head);
    }
  });

  wss.on("connection", (ws) => {
    let joinedCode = null;
    let playerId = null;

    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "create") {
        const code = generateCode();
        playerId = randomUUID();
        joinedCode = code;
        const room = {
          code,
          maxPlayers: Math.min(6, Math.max(2, Number(msg.maxPlayers) || 4)),
          players: [{ id: playerId, name: String(msg.hostName || "Hôte").slice(0, 20), isHost: true, connected: true }],
          started: false,
          sockets: new Map([[playerId, ws]]),
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
        const room = rooms.get(joinedCode);
        if (!room) return;
        room.players = room.players.filter((p) => p.id !== playerId);
        room.sockets.delete(playerId);
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
        const room = rooms.get(joinedCode);
        if (!room) return;
        const me = room.players.find((p) => p.id === playerId);
        if (!me?.isHost || room.players.length < 2) return;
        room.started = true;
        broadcast(room, { type: "lobby", lobby: publicRoom(room) });
        return;
      }
    });

    ws.on("close", () => {
      const room = rooms.get(joinedCode);
      if (!room) return;
      const me = room.players.find((p) => p.id === playerId);
      if (!me) return;
      me.connected = false;
      room.sockets.delete(playerId);
      broadcast(room, { type: "lobby", lobby: publicRoom(room) });
    });
  });

  server.listen(port, () => {
    console.log(`> En jour de paie prêt sur le port ${port} (${dev ? "dev" : "production"})`);
  });
});
