import "./style.css";
import { applyMove, createGame, type GameState } from "./engine.js";
import type { Player } from "./rules.js";
import { unlockAudio, playDrawSound, playMoveSound, playWinSound } from "./audio.js";
import { createEffects } from "./effects.js";
import { createBoardView, hudMessage } from "./ui.js";

const boardEl = document.querySelector<HTMLDivElement>("#board")!;
const boardWrap = document.querySelector<HTMLDivElement>("#board-wrap")!;
const hudEl = document.querySelector<HTMLParagraphElement>("#hud")!;
const restartBtn = document.querySelector<HTMLButtonElement>("#restart")!;
const scoreP1El = document.querySelector<HTMLElement>("#score-p1")!;
const scoreP2El = document.querySelector<HTMLElement>("#score-p2")!;
const resetScoresBtn = document.querySelector<HTMLButtonElement>("#reset-scores")!;

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
    void ensureAudio();
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
