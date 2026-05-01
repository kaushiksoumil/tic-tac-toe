import type { GameState } from "./engine.js";
import type { Player } from "./rules.js";

export type ClientToServer = { type: "move"; index: number } | { type: "reset" };

export type ServerSnapshot = {
  type: "snapshot";
  you: Player;
  game: GameState;
  players: number;
  error?: string;
};
