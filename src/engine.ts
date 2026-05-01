import type { Cell, Player } from "./rules.js";
import { getWinner, isBoardFull } from "./rules.js";

export type GameStatus = "playing" | "win" | "draw";

export type GameState = {
  board: Cell[];
  currentPlayer: Player;
  status: GameStatus;
  /** Set when status is win — indices of winning line */
  winningLine: readonly number[] | null;
};

const emptyBoard = (): Cell[] => Array.from({ length: 9 }, () => null);

export function createGame(): GameState {
  return {
    board: emptyBoard(),
    currentPlayer: "X",
    status: "playing",
    winningLine: null,
  };
}

export type ApplyMoveOk = { ok: true; state: GameState };
export type ApplyMoveErr = { ok: false; error: string };
export type ApplyMoveResult = ApplyMoveOk | ApplyMoveErr;

export function applyMove(state: GameState, index: number): ApplyMoveResult {
  if (state.status !== "playing") {
    return { ok: false, error: "Game is over" };
  }
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return { ok: false, error: "Invalid cell" };
  }
  if (state.board[index] !== null) {
    return { ok: false, error: "Cell occupied" };
  }

  const board = [...state.board] as Cell[];
  board[index] = state.currentPlayer;

  const win = getWinner(board);
  if (win) {
    return {
      ok: true,
      state: {
        board,
        currentPlayer: state.currentPlayer,
        status: "win",
        winningLine: win.line,
      },
    };
  }

  if (isBoardFull(board)) {
    return {
      ok: true,
      state: {
        board,
        currentPlayer: state.currentPlayer,
        status: "draw",
        winningLine: null,
      },
    };
  }

  const next: Player = state.currentPlayer === "X" ? "O" : "X";
  return {
    ok: true,
    state: {
      board,
      currentPlayer: next,
      status: "playing",
      winningLine: null,
    },
  };
}
