import { useRef } from 'react';
import { Howl, Howler } from 'howler';

// Sound definitions — using freely-available CDN sounds or base64 data URIs
// We'll generate simple tones procedurally via AudioContext as a fallback
const SOUNDS = {
  slice:   { src: null, volume: 0.7 },
  bomb:    { src: null, volume: 0.9 },
  combo:   { src: null, volume: 0.6 },
  miss:    { src: null, volume: 0.5 },
  whoosh:  { src: null, volume: 0.3 },
};

/**
 * Generates a synthetic sound using Web Audio API.
 * Returns an AudioBuffer.
 */
function createSyntheticSound(ctx, type) {
  const duration = type === 'bomb' ? 0.4 : 0.15;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * (type === 'bomb' ? 6 : 20));

    switch (type) {
      case 'slice':
        data[i] = envelope * Math.sin(2 * Math.PI * (800 + 2000 * t) * t) * 0.5;
        break;
      case 'bomb':
        data[i] = envelope * (Math.random() * 2 - 1) * 0.8;
        break;
      case 'combo':
        data[i] = envelope * Math.sin(2 * Math.PI * (1200 + 400 * Math.sin(t * 30)) * t) * 0.4;
        break;
      case 'miss':
        data[i] = envelope * Math.sin(2 * Math.PI * 200 * t) * 0.3;
        break;
      case 'whoosh':
        data[i] = envelope * (Math.random() * 2 - 1) * 0.2;
        break;
      default:
        data[i] = 0;
    }
  }
  return buffer;
}

let audioCtx = null;
let soundBuffers = {};

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function ensureBuffers() {
  const ctx = getAudioContext();
  ['slice', 'bomb', 'combo', 'miss', 'whoosh'].forEach((type) => {
    if (!soundBuffers[type]) {
      soundBuffers[type] = createSyntheticSound(ctx, type);
    }
  });
}

function playBuffer(type, volume = 1) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    ensureBuffers();
    const source = ctx.createBufferSource();
    source.buffer = soundBuffers[type];
    const gainNode = ctx.createGain();
    gainNode.gain.value = SOUNDS[type]?.volume ?? volume;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  } catch {
    // Silently fail if audio is not available
  }
}

/**
 * Returns a play function: play('slice') | play('bomb') | etc.
 */
export function useSound() {
  const playRef = useRef((type) => playBuffer(type));
  return { play: (type) => playRef.current(type) };
}
