import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Index fingertip landmark index
const INDEX_TIP = 8;
// Index finger MCP (base knuckle) for large swing measurement
const INDEX_MCP = 5;
// Smoothing factor: 0 = no smoothing, 1 = full lag
const SMOOTH_ALPHA = 0.35;

/**
 * Initialises MediaPipe HandLandmarker and runs per-frame inference.
 *
 * @param {React.RefObject} videoRef - video element ref
 * @param {boolean} active - whether to run tracking
 * @returns {{ tipX, tipY, prevTipX, prevTipY, velocity, handVisible, isLargeSwing }}
 */
export function useHandTracker(videoRef, active = true) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const smoothedRef = useRef({ x: -1, y: -1 });
  const prevRef = useRef({ x: -1, y: -1 });

  const [result, setResult] = useState({
    tipX: -1,
    tipY: -1,
    prevTipX: -1,
    prevTipY: -1,
    velocity: 0,
    handVisible: false,
    isLargeSwing: false,
  });

  // Initialise the landmarker once
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) landmarkerRef.current = landmarker;
      } catch (err) {
        console.error('HandLandmarker init error:', err);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  const detect = useCallback((timestamp) => {
    if (!active) return;
    rafRef.current = requestAnimationFrame(detect);

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;
    if (timestamp - lastTimeRef.current < 16) return; // cap at ~60fps
    lastTimeRef.current = timestamp;

    const detection = landmarker.detectForVideo(video, timestamp);
    const landmarks = detection?.landmarks?.[0];

    if (!landmarks) {
      prevRef.current = { x: -1, y: -1 };
      smoothedRef.current = { x: -1, y: -1 };
      setResult((r) => ({ ...r, handVisible: false, tipX: -1, tipY: -1, velocity: 0 }));
      return;
    }

    const tip = landmarks[INDEX_TIP];
    const mcp = landmarks[INDEX_MCP];

    // Raw normalized coords (0-1). Note: MediaPipe mirrors x for front cam.
    // We mirror x back since the video is CSS-mirrored.
    const rawX = 1 - tip.x;
    const rawY = tip.y;

    // Exponential smoothing
    const prev = smoothedRef.current;
    const sx = prev.x === -1 ? rawX : SMOOTH_ALPHA * rawX + (1 - SMOOTH_ALPHA) * prev.x;
    const sy = prev.y === -1 ? rawY : SMOOTH_ALPHA * rawY + (1 - SMOOTH_ALPHA) * prev.y;

    const dx = sx - (prev.x === -1 ? sx : prev.x);
    const dy = sy - (prev.y === -1 ? sy : prev.y);
    const velocity = Math.hypot(dx, dy);

    // Large swing: MCP-to-tip length in screen space > threshold
    const swingDist = Math.hypot((1 - tip.x) - (1 - mcp.x), tip.y - mcp.y);
    const isLargeSwing = velocity > 0.015 && swingDist > 0.08;

    prevRef.current = { x: prev.x, y: prev.y };
    smoothedRef.current = { x: sx, y: sy };

    setResult({
      tipX: sx,
      tipY: sy,
      prevTipX: prev.x === -1 ? sx : prev.x,
      prevTipY: prev.y === -1 ? sy : prev.y,
      velocity,
      handVisible: true,
      isLargeSwing,
    });
  }, [videoRef, active]);

  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(detect);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, detect]);

  return result;
}
