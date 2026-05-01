import type { GameState } from "./engine.js";
import type { PlayerDisplayNames } from "./player-names.js";
import type { Player } from "./rules.js";

export type SessionScores = Record<Player, number>;

export type ClientToServer =
  | { type: "move"; index: number }
  | { type: "reset" }
  | { type: "setName"; name: string }
  | { type: "resetScores" };

export type ServerSnapshot = {
  type: "snapshot";
  you: Player;
  game: GameState;
  players: number;
  names: PlayerDisplayNames;
  scores: SessionScores;
  error?: string;
};
