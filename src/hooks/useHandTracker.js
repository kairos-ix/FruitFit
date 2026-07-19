import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const INDEX_TIP = 8;
const INDEX_MCP = 5;

const HAND_LOST_GRACE_FRAMES = 3;

function defaultHandData() {
  return {
    tipX: -1,
    tipY: -1,
    velocity: 0,
    handVisible: false,
    isLargeSwing: false,
  };
}

/**
 * Initialises MediaPipe HandLandmarker and runs per-frame inference.
 * Returns a mutable ref — game loop reads handDataRef.current directly.
 *
 * Minimal smoothing here — just enough to kill camera jitter.
 * The game engine handles prev/current tracking for slice detection.
 */
export function useHandTracker(videoRef, active = true) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedRef = useRef({ x: -1, y: -1 });
  const handLostCountRef = useRef(0);

  const handDataRef = useRef(defaultHandData());

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
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
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

  const detect = useCallback(function detectFn(timestamp) {
    if (!active) return;
    rafRef.current = requestAnimationFrame(detectFn);

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    const videoTime = video.currentTime;
    if (videoTime === lastVideoTimeRef.current || videoTime === 0) return;
    lastVideoTimeRef.current = videoTime;

    const detection = landmarker.detectForVideo(video, timestamp);
    const landmarks = detection?.landmarks?.[0];

    if (!landmarks) {
      handLostCountRef.current++;
      if (handLostCountRef.current > HAND_LOST_GRACE_FRAMES) {
        smoothedRef.current = { x: -1, y: -1 };
        handDataRef.current = defaultHandData();
      }
      return;
    }

    handLostCountRef.current = 0;

    const tip = landmarks[INDEX_TIP];
    const mcp = landmarks[INDEX_MCP];

    // Mirror x for front camera
    const rawX = 1 - tip.x;
    const rawY = tip.y;

    const prev = smoothedRef.current;
    const isFirst = prev.x === -1;

    // Very light jitter filter — alpha=0.9 means 90% raw, 10% previous.
    // Nearly raw tracking for minimal latency.
    const alpha = 0.9;
    const sx = isFirst ? rawX : alpha * rawX + (1 - alpha) * prev.x;
    const sy = isFirst ? rawY : alpha * rawY + (1 - alpha) * prev.y;

    const dx = isFirst ? 0 : sx - prev.x;
    const dy = isFirst ? 0 : sy - prev.y;
    const velocity = Math.hypot(dx, dy);

    const swingDist = Math.hypot((1 - tip.x) - (1 - mcp.x), tip.y - mcp.y);
    const isLargeSwing = velocity > 0.012 && swingDist > 0.08;

    smoothedRef.current = { x: sx, y: sy };

    handDataRef.current = {
      tipX: sx,
      tipY: sy,
      velocity,
      handVisible: true,
      isLargeSwing,
    };
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

  return handDataRef;
}
