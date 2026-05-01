type OscType = OscillatorType;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

/** Call from first user gesture so playback is allowed */
export async function unlockAudio(): Promise<void> {
  const c = getCtx();
  if (c.state === "suspended") {
    await c.resume();
  }
}

function beep(
  frequency: number,
  durationSec: number,
  type: OscType = "sine",
  gain = 0.12,
  when?: number,
) {
  const c = getCtx();
  const t0 = when ?? c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.05);
}

export function playMoveSound(player: "X" | "O") {
  try {
    const c = getCtx();
    if (c.state !== "running") return;
    const base = player === "X" ? 520 : 380;
    beep(base, 0.06, "square", 0.08);
    beep(base * 1.25, 0.05, "square", 0.05, c.currentTime + 0.04);
  } catch {
    /* ignore */
  }
}

export function playWinSound() {
  try {
    const c = getCtx();
    if (c.state !== "running") return;
    const t = c.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      beep(freq, 0.14, "sine", 0.1, t + i * 0.1);
    });
  } catch {
    /* ignore */
  }
}

export function playDrawSound() {
  try {
    const c = getCtx();
    if (c.state !== "running") return;
    beep(200, 0.2, "triangle", 0.09);
    beep(180, 0.22, "triangle", 0.07, c.currentTime + 0.15);
  } catch {
    /* ignore */
  }
}
