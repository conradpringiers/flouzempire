let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, volume: number = 0.04, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playNoise(duration: number, volume: number = 0.02) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 6000;
    bandpass.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  } catch {}
}

export function useSounds() {
  // Tap on the hustle area - soft thud, not high-pitched
  const tap = () => {
    playTone(1200, 0.025, 0.02, 'sine');
    playNoise(0.01, 0.008);
  };
  // Generic button click - micro click
  const click = () => {
    playTone(3800, 0.015, 0.012, 'square');
    playNoise(0.006, 0.006);
  };
  // Purchase / upgrade / confirmation success - gentle ascending
  const success = () => {
    playTone(1600, 0.05, 0.025, 'sine');
    setTimeout(() => playTone(2100, 0.05, 0.025, 'sine'), 50);
    setTimeout(() => playTone(2800, 0.06, 0.025, 'sine'), 110);
  };
  // Coin earn - tiny ding
  const coin = () => {
    playTone(5000, 0.02, 0.012, 'square');
    setTimeout(() => playTone(6000, 0.015, 0.008, 'square'), 25);
  };
  // Tab switch - crisp tick
  const switchTab = () => {
    playTone(3200, 0.012, 0.015, 'square');
    playNoise(0.005, 0.005);
  };
  // Navigation / open screen - soft tick
  const nav = () => {
    playTone(2800, 0.015, 0.01, 'sine');
    playNoise(0.005, 0.005);
  };
  // Toggle on/off - tiny pip
  const toggle = () => {
    playTone(4800, 0.008, 0.012, 'square');
  };

  return { tap, click, success, coin, switchTab, nav, toggle };
}
