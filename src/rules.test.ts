import { describe, expect, it } from "vitest";
import { getWinner, isBoardFull, isDraw, WIN_LINES, type Cell } from "./rules.js";

function board(...cells: Cell[]): Cell[] {
  if (cells.length !== 9) throw new Error("need 9 cells");
  return cells;
}

describe("getWinner", () => {
  it("returns null on empty board", () => {
    expect(getWinner(board(null, null, null, null, null, null, null, null, null))).toBeNull();
  });

  it.each(WIN_LINES)("detects win on line %j", (a, b, c) => {
    const line = [a, b, c] as const;
    const cells: Cell[] = Array(9).fill(null);
    cells[line[0]] = "X";
    cells[line[1]] = "X";
    cells[line[2]] = "X";
    expect(getWinner(cells)).toEqual({ winner: "X", line });
  });

  it("detects O win", () => {
    const cells = board("O", "O", "O", null, "X", null, "X", null, null);
    expect(getWinner(cells)).toEqual({ winner: "O", line: [0, 1, 2] });
  });

  it("does not false positive when line mixed", () => {
    const cells = board("X", "O", "X", null, null, null, null, null, null);
    expect(getWinner(cells)).toBeNull();
  });
});

describe("isBoardFull", () => {
  it("false when any empty", () => {
    expect(isBoardFull(board("X", "O", "X", "O", "X", "O", "O", "X", null))).toBe(false);
  });

  it("true when all filled", () => {
    expect(isBoardFull(board("X", "O", "X", "O", "X", "O", "O", "X", "O"))).toBe(true);
  });
});

describe("isDraw", () => {
  it("true on classic cat game", () => {
    const cells = board("X", "O", "X", "X", "O", "O", "O", "X", "X");
    expect(getWinner(cells)).toBeNull();
    expect(isDraw(cells)).toBe(true);
  });

  it("false when winner exists", () => {
    const cells = board("X", "X", "X", "O", "O", null, null, null, null);
    expect(isDraw(cells)).toBe(false);
  });

  it("false when board not full", () => {
    const cells = board("X", "O", null, null, null, null, null, null, null);
    expect(isDraw(cells)).toBe(false);
  });
});
