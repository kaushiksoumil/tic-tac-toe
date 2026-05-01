import type { Player } from "./rules.js";

export type PlayerDisplayNames = { X: string; O: string };

export const DEFAULT_DISPLAY_NAMES: PlayerDisplayNames = {
  X: "Player 1",
  O: "Player 2",
};

export function normalizePlayerName(raw: string, fallback: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (t === "") return fallback;
  return t.slice(0, 24);
}

export function defaultNameForSeat(seat: Player): string {
  return seat === "X" ? DEFAULT_DISPLAY_NAMES.X : DEFAULT_DISPLAY_NAMES.O;
}
