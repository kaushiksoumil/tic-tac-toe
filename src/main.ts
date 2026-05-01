import "./style.css";
import { applyMove, createGame, type GameState } from "./engine.js";
import type { Player } from "./rules.js";
import { unlockAudio, playDrawSound, playMoveSound, playWinSound } from "./audio.js";
import { createEffects } from "./effects.js";
import { createBoardView, hudMessage } from "./ui.js";
import type { ServerSnapshot } from "./realtime.js";

const boardEl = document.querySelector<HTMLDivElement>("#board")!;
const boardWrap = document.querySelector<HTMLDivElement>("#board-wrap")!;
const hudEl = document.querySelector<HTMLParagraphElement>("#hud")!;
const restartBtn = document.querySelector<HTMLButtonElement>("#restart")!;
const scoreP1El = document.querySelector<HTMLElement>("#score-p1")!;
const scoreP2El = document.querySelector<HTMLElement>("#score-p2")!;
const resetScoresBtn = document.querySelector<HTMLButtonElement>("#reset-scores")!;
const subtitleEl = document.querySelector<HTMLElement>(".subtitle");
const scoreboardWrap = document.querySelector<HTMLElement>(".scoreboard-wrap");

function findChangedCell(prev: GameState | null, next: GameState): number | undefined {
  if (!prev) return undefined;
  for (let i = 0; i < 9; i++) {
    if (prev.board[i] !== next.board[i]) return i;
  }
  return undefined;
}

function startLocalMode() {
  let state: GameState = createGame();
  let wins: Record<Player, number> = { X: 0, O: 0 };
  const effects = createEffects({ board: boardEl, boardWrap });
  let audioUnlocked = false;

  async function ensureAudio() {
    if (!audioUnlocked) {
      await unlockAudio();
      audioUnlocked = true;
    }
  }

  function applyHud() {
    const { text, className } = hudMessage(state);
    hudEl.textContent = text;
    hudEl.className = className;
  }

  function applyScoreboard() {
    scoreP1El.textContent = String(wins.X);
    scoreP2El.textContent = String(wins.O);
  }

  function resetScores() {
    wins = { X: 0, O: 0 };
    applyScoreboard();
  }

  const boardView = createBoardView(boardEl, {
    onCellClick: (index) => {
      void (async () => {
        await ensureAudio();
        const prev = state;
        const result = applyMove(state, index);
        if (!result.ok) return;

        state = result.state;
        const lastMove = index;
        const cell = boardView.render(state, { lastMove, animateLast: true });
        if (cell) effects.playCellPop(cell);
        applyHud();
        effects.syncBoardVisuals(state);

        if (state.status === "playing") {
          playMoveSound(prev.currentPlayer);
        } else if (state.status === "win") {
          wins[state.currentPlayer] += 1;
          applyScoreboard();
          playMoveSound(prev.currentPlayer);
          playWinSound();
          effects.celebrateWin();
        } else if (state.status === "draw") {
          playMoveSound(prev.currentPlayer);
          playDrawSound();
          effects.subtleDrawFeedback();
        }
      })();
    },
  });

  function resetGame() {
    void ensureAudio();
    state = createGame();
    boardView.render(state, { animateLast: false });
    applyHud();
    effects.syncBoardVisuals(state);
  }

  boardView.render(state, { animateLast: false });
  applyHud();
  applyScoreboard();

  restartBtn.addEventListener("click", () => {
    void ensureAudio();
    resetGame();
  });

  resetScoresBtn.addEventListener("click", () => {
    resetScores();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (document.activeElement === resetScoresBtn) {
        return;
      }
      e.preventDefault();
      resetGame();
    }
  });
}

function startOnlineMode(wsUrl: string) {
  scoreboardWrap?.classList.add("scoreboard-wrap--hidden");
  resetScoresBtn.hidden = true;
  if (subtitleEl) {
    subtitleEl.innerHTML =
      "Realtime · one shared room — first tab is Player 1, second is Player 2 — <kbd>R</kbd> resets for everyone";
  }

  let state: GameState = createGame();
  let mySeat: Player = "X";
  let players = 1;
  let prevState: GameState | null = null;
  const effects = createEffects({ board: boardEl, boardWrap });
  let audioUnlocked = false;
  let wsConn: WebSocket | null = null;

  async function ensureAudio() {
    if (!audioUnlocked) {
      await unlockAudio();
      audioUnlocked = true;
    }
  }

  function applyHud() {
    const { text, className } = hudMessage(state, { players, you: mySeat });
    hudEl.textContent = text;
    hudEl.className = className;
  }

  function showTransientError(text: string) {
    hudEl.textContent = text;
    hudEl.className = "hud hud--error";
    window.setTimeout(() => applyHud(), 2600);
  }

  const boardView = createBoardView(boardEl, {
    onCellClick: (index) => {
      void (async () => {
        await ensureAudio();
        if (!wsConn || wsConn.readyState !== WebSocket.OPEN) return;
        wsConn.send(JSON.stringify({ type: "move", index }));
      })();
    },
  });

  function applyOnlineCellLocks() {
    const ready = players >= 2;
    const playing = state.status === "playing";
    const yourTurn = playing && ready && state.currentPlayer === mySeat;
    for (let i = 0; i < boardView.cells.length; i++) {
      const occupied = state.board[i] !== null;
      boardView.cells[i]!.disabled = !playing || !ready || !yourTurn || occupied;
    }
  }

  function sendReset() {
    wsConn?.send(JSON.stringify({ type: "reset" }));
  }

  function applyIncomingSnapshot(payload: ServerSnapshot) {
    const next = payload.game;
    const boardCleared =
      next.board.every((c) => c === null) &&
      !!prevState &&
      prevState.board.some((c) => c !== null);
    const moveIndex = boardCleared ? undefined : findChangedCell(prevState, next);
    const prevWasPlaying = prevState?.status === "playing";
    prevState = next;
    state = next;
    mySeat = payload.you;
    players = payload.players;

    const cell = boardView.render(state, { lastMove: moveIndex, animateLast: moveIndex !== undefined });
    if (moveIndex !== undefined && cell && state.status === "playing") {
      effects.playCellPop(cell);
    }
    effects.syncBoardVisuals(state);
    applyOnlineCellLocks();

    if (prevWasPlaying && state.status === "win") {
      playMoveSound(state.currentPlayer);
      playWinSound();
      effects.celebrateWin();
    } else if (prevWasPlaying && state.status === "draw") {
      let mover: Player = state.currentPlayer;
      if (moveIndex !== undefined) {
        const c = next.board[moveIndex];
        if (c === "X" || c === "O") mover = c;
      }
      playMoveSound(mover);
      playDrawSound();
      effects.subtleDrawFeedback();
    } else if (moveIndex !== undefined && state.status === "playing") {
      const mover = next.board[moveIndex];
      if (mover) playMoveSound(mover);
    }

    if (payload.error) {
      showTransientError(payload.error);
    } else {
      applyHud();
    }
  }

  function connect() {
    const ws = new WebSocket(wsUrl);
    wsConn = ws;

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as ServerSnapshot;
        if (msg.type !== "snapshot") return;
        applyIncomingSnapshot(msg);
      } catch {
        /* ignore malformed */
      }
    });

    ws.addEventListener("open", () => {
      restartBtn.disabled = false;
      applyHud();
    });

    ws.addEventListener("close", () => {
      restartBtn.disabled = true;
      hudEl.textContent = "Disconnected — refresh the page to reconnect.";
      hudEl.className = "hud hud--error";
      for (const c of boardView.cells) {
        c.disabled = true;
      }
    });

    ws.addEventListener("error", () => {
      /* close handler surfaces reconnect message */
    });
  }

  boardView.render(state, { animateLast: false });
  applyHud();
  applyOnlineCellLocks();
  restartBtn.disabled = true;

  restartBtn.addEventListener("click", () => {
    void ensureAudio();
    sendReset();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      void ensureAudio();
      sendReset();
    }
  });

  connect();
}

const wsConfigured = import.meta.env.VITE_WS_URL?.trim();
if (wsConfigured) {
  startOnlineMode(wsConfigured);
} else {
  startLocalMode();
}
