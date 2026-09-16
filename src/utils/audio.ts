// Web Audio API friendly synthesizers for screen time alerts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * 2分钟预警提示音：温和的双音提示，提醒孩子时间快到了
 */
export function playTwoMinuteWarningChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  // Warm marimba/bell notes: E5 (659Hz) then G#5 (830Hz)
  osc1.frequency.setValueAtTime(659.25, now);
  osc1.frequency.exponentialRampToValueAtTime(830.61, now + 0.2);

  osc2.frequency.setValueAtTime(329.63, now);
  osc2.frequency.exponentialRampToValueAtTime(415.3, now + 0.2);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.9);
  osc2.stop(now + 0.9);
}

/**
 * 锁屏休息提示音：舒缓低沉的静心音
 */
export function playLockChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now); // A4
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.8); // A3

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.2);
}

/**
 * 解锁/临时密码生效提示音：欢快的清脆提示
 */
export function playUnlockChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + index * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}
