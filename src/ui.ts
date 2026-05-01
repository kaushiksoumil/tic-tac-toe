import type { GameState } from "./engine.js";
import { DEFAULT_DISPLAY_NAMES, type PlayerDisplayNames } from "./player-names.js";
import type { Cell, Player } from "./rules.js";

export type BoardHandlers = {
  onCellClick: (index: number) => void;
};

export type OnlineHudCtx = {
  players: number;
  you: Player;
};

export type HudOptions = {
  names: PlayerDisplayNames;
  online?: OnlineHudCtx;
};

function hudPlayerClass(p: Player): string {
  return p === "X" ? "p1" : "p2";
}

function cellLabel(v: Cell): string {
  if (v === null) return "";
  return v;
}

function cellClass(v: Cell): string {
  const base = "cell";
  if (v === "X") return `${base} cell--x`;
  if (v === "O") return `${base} cell--o`;
  return base;
}

export function createBoardView(container: HTMLElement, handlers: BoardHandlers) {
  const cells: HTMLButtonElement[] = [];

  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    btn.dataset.index = String(i);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Empty cell ${i + 1}`);
    btn.addEventListener("click", () => handlers.onCellClick(i));
    container.appendChild(btn);
    cells.push(btn);
  }

  function render(state: GameState, options?: { lastMove?: number; animateLast?: boolean }) {
    const winSet =
      state.status === "win" && state.winningLine
        ? new Set(state.winningLine as number[])
        : null;

    for (let i = 0; i < 9; i++) {
      const btn = cells[i]!;
      const v = state.board[i]!;
      btn.textContent = cellLabel(v);
      btn.className = cellClass(v);
      btn.setAttribute(
        "aria-label",
        v === null ? `Empty cell ${i + 1}` : `${v}, cell ${i + 1}`,
      );
      if (winSet?.has(i)) {
        btn.classList.add("cell--win");
      }
      const disabled = state.status !== "playing" || v !== null;
      btn.disabled = disabled;
    }

    if (options?.animateLast !== false && options?.lastMove !== undefined) {
      const cell = cells[options.lastMove];
      if (cell) {
        return cell;
      }
    }
    return null;
  }

  return { cells, render };
}

export function hudMessage(state: GameState, opts?: HudOptions): { text: string; className: string } {
  const names = opts?.names ?? DEFAULT_DISPLAY_NAMES;
  const online = opts?.online;

  if (online && online.players < 2) {
    return {
      text: `${names[online.you]} is here — waiting for a second player. Open this page in another browser or tab.`,
      className: "hud hud--waiting",
    };
  }

  if (state.status === "win") {
    if (online) {
      const youWon = state.currentPlayer === online.you;
      return {
        text: youWon ? "You win!" : `${names[state.currentPlayer]} wins!`,
        className: "hud hud--win",
      };
    }
    return {
      text: `${names[state.currentPlayer]} wins!`,
      className: "hud hud--win",
    };
  }

  if (state.status === "draw") {
    return { text: "Draw — board full", className: "hud hud--draw" };
  }

  const turn = state.currentPlayer;
  if (online) {
    const isYours = turn === online.you;
    return {
      text: isYours ? "Your turn" : `${names[turn]}'s turn`,
      className: `hud hud--${hudPlayerClass(turn)}`,
    };
  }

  return {
    text: `${names[turn]}'s turn`,
    className: `hud hud--${hudPlayerClass(turn)}`,
  };
}
