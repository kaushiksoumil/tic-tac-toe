import type { GameState } from "./engine.js";

const WIN_GLOW_MS = 2200;
const TILT_MS = 400;

export type EffectElements = {
  board: HTMLElement;
  boardWrap: HTMLElement;
};

export function createEffects(els: EffectElements) {
  let glowTimer: ReturnType<typeof setTimeout> | null = null;
  let tiltTimer: ReturnType<typeof setTimeout> | null = null;

  function clearGlowTimer() {
    if (glowTimer !== null) {
      clearTimeout(glowTimer);
      glowTimer = null;
    }
  }

  function clearTiltTimer() {
    if (tiltTimer !== null) {
      clearTimeout(tiltTimer);
      tiltTimer = null;
    }
  }

  return {
    /** Brief scale pop on the cell that was just played */
    playCellPop(cell: HTMLElement) {
      cell.classList.remove("cell--pop");
      void cell.offsetWidth;
      cell.classList.add("cell--pop");
      const remove = () => cell.classList.remove("cell--pop");
      cell.addEventListener("animationend", remove, { once: true });
    },

    syncBoardVisuals(state: GameState) {
      clearGlowTimer();
      els.board.classList.toggle("board--glow", state.status === "win");
      if (state.status === "win") {
        glowTimer = setTimeout(() => {
          els.board.classList.remove("board--glow");
          glowTimer = null;
        }, WIN_GLOW_MS);
      }
    },

    celebrateWin() {
      clearTiltTimer();
      els.boardWrap.classList.add("board-wrap--tilt");
      tiltTimer = setTimeout(() => {
        els.boardWrap.classList.remove("board-wrap--tilt");
        tiltTimer = null;
      }, TILT_MS);
    },

    subtleDrawFeedback() {
      els.board.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
        { duration: 280, easing: "ease-out" },
      );
    },
  };
}
