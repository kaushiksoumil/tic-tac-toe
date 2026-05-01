import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { RawData } from "ws";
import { createGame, applyMove, type GameState } from "../src/engine.js";
import type { Player } from "../src/rules.js";
import {
  DEFAULT_DISPLAY_NAMES,
  normalizePlayerName,
  type PlayerDisplayNames,
} from "../src/player-names.js";
import type { ClientToServer, ServerSnapshot, SessionScores } from "../src/realtime.js";

const PORT = Number(process.env.PORT ?? 8787);

const ZERO_SCORES = (): SessionScores => ({ X: 0, O: 0 });

const clients = new Map<WebSocket, Player>();
let game: GameState = createGame();
let displayNames: PlayerDisplayNames = { ...DEFAULT_DISPLAY_NAMES };
let sessionWins: SessionScores = ZERO_SCORES();

function rawToString(data: RawData): string | null {
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8");
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  return null;
}

function parseClientMsg(data: RawData): ClientToServer | null {
  const text = rawToString(data);
  if (text === null || text === "") return null;
  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== "object" || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (o.type === "reset") return { type: "reset" };
    if (o.type === "resetScores") return { type: "resetScores" };
    if (o.type === "setName" && typeof o.name === "string") return { type: "setName", name: o.name };
    if (o.type === "move") {
      if (typeof o.index === "number" && Number.isInteger(o.index)) {
        return { type: "move", index: o.index };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function sendSnapshot(ws: WebSocket, you: Player, error?: string) {
  const msg: ServerSnapshot = {
    type: "snapshot",
    you,
    game,
    players: clients.size,
    names: { ...displayNames },
    scores: { ...sessionWins },
  };
  if (error) msg.error = error;
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast() {
  for (const [ws, you] of clients) {
    sendSnapshot(ws, you);
  }
}

function handleDisconnect(ws: WebSocket) {
  clients.delete(ws);
  game = createGame();
  displayNames = { ...DEFAULT_DISPLAY_NAMES };
  sessionWins = ZERO_SCORES();
  const remaining = [...clients.keys()];
  if (remaining.length === 1) {
    clients.set(remaining[0], "X");
  }
  broadcast();
}

function handleMessage(ws: WebSocket, data: RawData) {
  const seat = clients.get(ws);
  if (!seat) return;

  const msg = parseClientMsg(data);
  if (!msg) {
    sendSnapshot(ws, seat, "Invalid message");
    return;
  }

  if (msg.type === "reset") {
    game = createGame();
    broadcast();
    return;
  }

  if (msg.type === "setName") {
    const fallback = DEFAULT_DISPLAY_NAMES[seat];
    displayNames = {
      ...displayNames,
      [seat]: normalizePlayerName(msg.name, fallback),
    };
    broadcast();
    return;
  }

  if (msg.type === "resetScores") {
    sessionWins = ZERO_SCORES();
    broadcast();
    return;
  }

  if (clients.size < 2) {
    sendSnapshot(ws, seat, "Waiting for second player");
    return;
  }

  if (game.status !== "playing") {
    sendSnapshot(ws, seat, "Game is over");
    return;
  }

  if (seat !== game.currentPlayer) {
    sendSnapshot(ws, seat, "Not your turn");
    return;
  }

  const result = applyMove(game, msg.index);
  if (!result.ok) {
    sendSnapshot(ws, seat, result.error);
    return;
  }

  game = result.state;
  if (game.status === "win") {
    sessionWins = {
      ...sessionWins,
      [game.currentPlayer]: sessionWins[game.currentPlayer] + 1,
    };
  }
  broadcast();
}

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  if (clients.size >= 2) {
    ws.close(4403, "Room full");
    return;
  }

  const seat: Player = clients.size === 0 ? "X" : "O";
  clients.set(ws, seat);

  ws.on("message", (data) => {
    handleMessage(ws, data);
  });

  ws.on("close", () => {
    if (!clients.has(ws)) return;
    handleDisconnect(ws);
  });

  broadcast();
});

httpServer.listen(PORT, () => {
  console.log(`Tic-tac-toe realtime server listening on port ${PORT} (ws)`);
});
