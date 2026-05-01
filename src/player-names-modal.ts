import type { Player } from "./rules.js";
import {
  type PlayerDisplayNames,
  DEFAULT_DISPLAY_NAMES,
  normalizePlayerName,
  defaultNameForSeat,
} from "./player-names.js";

export function promptLocalPlayerNames(): Promise<PlayerDisplayNames> {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "name-gate";

    const panel = document.createElement("div");
    panel.className = "name-gate__panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "name-gate-title");

    const title = document.createElement("h2");
    title.id = "name-gate-title";
    title.className = "name-gate__title";
    title.textContent = "Who’s playing?";

    const lblX = document.createElement("label");
    lblX.className = "name-gate__label";
    lblX.htmlFor = "name-gate-x";
    lblX.textContent = "Player 1 ( X )";

    const inX = document.createElement("input");
    inX.id = "name-gate-x";
    inX.type = "text";
    inX.className = "name-gate__input";
    inX.placeholder = DEFAULT_DISPLAY_NAMES.X;
    inX.maxLength = 24;
    inX.autocomplete = "off";

    const lblO = document.createElement("label");
    lblO.className = "name-gate__label";
    lblO.htmlFor = "name-gate-o";
    lblO.textContent = "Player 2 ( O )";

    const inO = document.createElement("input");
    inO.id = "name-gate-o";
    inO.type = "text";
    inO.className = "name-gate__input";
    inO.placeholder = DEFAULT_DISPLAY_NAMES.O;
    inO.maxLength = 24;
    inO.autocomplete = "off";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn name-gate__submit";
    btn.textContent = "Start game";

    let finished = false;
    const teardown = () => {
      document.removeEventListener("keydown", onEscape, true);
      backdrop.remove();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      teardown();
      resolve({
        X: normalizePlayerName(inX.value, DEFAULT_DISPLAY_NAMES.X),
        O: normalizePlayerName(inO.value, DEFAULT_DISPLAY_NAMES.O),
      });
    };

    function onEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      finish();
    }
    document.addEventListener("keydown", onEscape, true);

    btn.addEventListener("click", finish);
    inX.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        inO.focus();
      }
    });
    inO.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    });

    panel.append(title, lblX, inX, lblO, inO, btn);
    backdrop.append(panel);
    document.body.append(backdrop);
    queueMicrotask(() => inX.focus());
  });
}

export function promptOnlinePlayerName(seat: Player): Promise<string> {
  const fallback = defaultNameForSeat(seat);
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "name-gate";

    const panel = document.createElement("div");
    panel.className = "name-gate__panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "name-gate-online-title");

    const title = document.createElement("h2");
    title.id = "name-gate-online-title";
    title.className = "name-gate__title";
    title.textContent = seat === "X" ? "You are Player 1 ( X )" : "You are Player 2 ( O )";

    const hint = document.createElement("p");
    hint.className = "name-gate__hint";
    hint.textContent = "Your name appears on turns so both players stay oriented.";

    const lbl = document.createElement("label");
    lbl.className = "name-gate__label";
    lbl.htmlFor = "name-gate-self";
    lbl.textContent = "Your name";

    const input = document.createElement("input");
    input.id = "name-gate-self";
    input.type = "text";
    input.className = "name-gate__input";
    input.placeholder = fallback;
    input.maxLength = 24;
    input.autocomplete = "off";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn name-gate__submit";
    btn.textContent = "Save";

    let finished = false;
    const teardown = () => {
      document.removeEventListener("keydown", onEscape, true);
      backdrop.remove();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      teardown();
      resolve(normalizePlayerName(input.value, fallback));
    };

    function onEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      finish();
    }
    document.addEventListener("keydown", onEscape, true);

    btn.addEventListener("click", finish);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish();
    });

    panel.append(title, hint, lbl, input, btn);
    backdrop.append(panel);
    document.body.append(backdrop);
    queueMicrotask(() => input.focus());
  });
}
