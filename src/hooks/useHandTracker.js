import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const INDEX_TIP = 8;
const INDEX_MCP = 5;

// Adaptive smoothing — lower = smoother, higher = more responsive
const SMOOTH_SLOW = 0.50;
const SMOOTH_FAST = 0.95;
const VEL_SLOW = 0.003;
const VEL_FAST = 0.03;

const TRAIL_HISTORY_LEN = 8;
const HAND_LOST_GRACE_FRAMES = 3;

function defaultHandData() {
  return {
    tipX: -1,
    tipY: -1,
    prevTipX: -1,
    prevTipY: -1,
    velX: 0,
    velY: 0,
    velocity: 0,
    handVisible: false,
    isLargeSwing: false,
    trailHistory: [],
    _frameId: 0,
  };
}

/**
 * Initialises MediaPipe HandLandmarker and runs per-frame inference.
 * Returns a mutable ref — game loop reads handDataRef.current directly.
 *
 * The ref also includes velX/velY so the game engine can interpolate
 * between camera frames for buttery-smooth 60fps trail rendering.
 */
export function useHandTracker(videoRef, active = true) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedRef = useRef({ x: -1, y: -1 });
  const trailRef = useRef([]);
  const handLostCountRef = useRef(0);
  const frameIdRef = useRef(0);

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
        trailRef.current = [];
        handDataRef.current = defaultHandData();
      }
      return;
    }

    handLostCountRef.current = 0;
    frameIdRef.current++;

    const tip = landmarks[INDEX_TIP];
    const mcp = landmarks[INDEX_MCP];

    const rawX = 1 - tip.x;
    const rawY = tip.y;

    const prev = smoothedRef.current;
    const isFirst = prev.x === -1;

    const rawDx = isFirst ? 0 : rawX - prev.x;
    const rawDy = isFirst ? 0 : rawY - prev.y;
    const rawVel = Math.hypot(rawDx, rawDy);

    const velT = Math.min(1, Math.max(0, (rawVel - VEL_SLOW) / (VEL_FAST - VEL_SLOW)));
    const alpha = SMOOTH_SLOW + (SMOOTH_FAST - SMOOTH_SLOW) * velT;

    const sx = isFirst ? rawX : alpha * rawX + (1 - alpha) * prev.x;
    const sy = isFirst ? rawY : alpha * rawY + (1 - alpha) * prev.y;

    const dx = isFirst ? 0 : sx - prev.x;
    const dy = isFirst ? 0 : sy - prev.y;
    const velocity = Math.hypot(dx, dy);

    const swingDist = Math.hypot((1 - tip.x) - (1 - mcp.x), tip.y - mcp.y);
    const isLargeSwing = velocity > 0.012 && swingDist > 0.08;

    const trail = trailRef.current;
    const prevTipX = trail.length > 0 ? trail[trail.length - 1].x : sx;
    const prevTipY = trail.length > 0 ? trail[trail.length - 1].y : sy;

    trail.push({ x: sx, y: sy });
    if (trail.length > TRAIL_HISTORY_LEN) {
      trail.splice(0, trail.length - TRAIL_HISTORY_LEN);
    }

    smoothedRef.current = { x: sx, y: sy };

    handDataRef.current = {
      tipX: sx,
      tipY: sy,
      prevTipX,
      prevTipY,
      velX: dx,
      velY: dy,
      velocity,
      handVisible: true,
      isLargeSwing,
      trailHistory: trail.slice(),
      _frameId: frameIdRef.current,
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
