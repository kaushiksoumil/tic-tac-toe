import type { GameState } from "./engine.js";
import type { Cell, Player } from "./rules.js";

export type BoardHandlers = {
  onCellClick: (index: number) => void;
};

export function playerName(p: Player): string {
  return p === "X" ? "Player 1" : "Player 2";
}

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

export function hudMessage(state: GameState): { text: string; className: string } {
  if (state.status === "win") {
    return {
      text: `${playerName(state.currentPlayer)} wins!`,
      className: "hud hud--win",
    };
  }
  if (state.status === "draw") {
    return { text: "Draw — board full", className: "hud hud--draw" };
  }
  const turn = state.currentPlayer;
  return {
    text: `${playerName(turn)}'s turn`,
    className: `hud hud--${hudPlayerClass(turn)}`,
  };
}
