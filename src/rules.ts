export type Player = "X" | "O";
export type Cell = Player | null;

/** Index positions:
 * 0 1 2
 * 3 4 5
 * 6 7 8
 */
export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export type WinResult = { winner: Player; line: readonly [number, number, number] };

export function getWinner(board: readonly Cell[]): WinResult | null {
  for (const [a, b, c] of WIN_LINES) {
    const x = board[a];
    if (x !== null && x === board[b] && x === board[c]) {
      return { winner: x, line: [a, b, c] };
    }
  }
  return null;
}

export function isBoardFull(board: readonly Cell[]): boolean {
  return board.every((c) => c !== null);
}

export function isDraw(board: readonly Cell[]): boolean {
  return getWinner(board) === null && isBoardFull(board);
}
