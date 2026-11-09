let context: AudioContext | undefined;

const tone = (frequency: number, duration: number, gainValue = 0.025) => {
  context ??= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

export const playMove = () => tone(510, 0.16);
export const playBlocked = () => tone(130, 0.12, 0.018);
export const playWin = () => {
  [0, 0.12, 0.24].forEach((delay, index) => setTimeout(() => tone([440, 620, 820][index], 0.35, 0.03), delay * 1000));
};

export const haptic = (pattern: number | number[]) => navigator.vibrate?.(pattern);
