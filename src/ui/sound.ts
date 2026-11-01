let context: AudioContext | null = null;

const audio = (): AudioContext | null => {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return null;
  }
  context ??= new AudioContext();
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
};

interface Tone {
  at?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
}

function tone(
  frequency: number,
  { at = 0, duration = 0.12, type = "sine", volume = 0.12, slideTo }: Tone = {}
) {
  const ctx = audio();
  if (!ctx) {
    return;
  }
  const start = ctx.currentTime + at;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      slideTo,
      start + duration
    );
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

const melody = (notes: number[], step: number, options: Tone) =>
  notes.forEach((note, i) => tone(note, { ...options, at: i * step }));

export const sounds = {
  move: () => tone(520, { duration: 0.08, type: "triangle", volume: 0.1 }),
  capture: () =>
    tone(320, { duration: 0.14, type: "square", volume: 0.06, slideTo: 150 }),
  promote: () =>
    melody([660, 880, 1100], 0.09, { duration: 0.18, volume: 0.1 }),
  win: () =>
    melody([523, 659, 784, 1047], 0.12, {
      duration: 0.24,
      type: "triangle",
      volume: 0.12,
    }),
  lose: () =>
    melody([440, 370, 311], 0.16, {
      duration: 0.3,
      type: "sawtooth",
      volume: 0.05,
    }),
  draw: () =>
    melody([523, 523], 0.18, { duration: 0.2, type: "triangle", volume: 0.1 }),
  error: () =>
    tone(220, { duration: 0.2, type: "square", volume: 0.05, slideTo: 140 }),
};
