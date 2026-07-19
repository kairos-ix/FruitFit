import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Index fingertip landmark index
const INDEX_TIP = 8;
// Index finger MCP (base knuckle) for large swing measurement
const INDEX_MCP = 5;

// Adaptive smoothing range — lower values = more responsive, higher = smoother
const SMOOTH_SLOW = 0.55; // when hand is nearly stationary (jitter suppression)
const SMOOTH_FAST = 1.0;  // during fast swipes (1.0 = raw tracking, ZERO latency gap)
// Velocity thresholds for adaptive smoothing transition
const VEL_SLOW = 0.002;
const VEL_FAST = 0.03;

// Trail history length for multi-segment slice detection
const TRAIL_HISTORY_LEN = 8;

// Number of frames without hand before we declare hand lost
// Prevents flicker when MediaPipe briefly loses the hand between frames
const HAND_LOST_GRACE_FRAMES = 3;

/**
 * Default hand data shape — used as initial value and when hand is not visible.
 */
function defaultHandData() {
  return {
    tipX: -1,
    tipY: -1,
    prevTipX: -1,
    prevTipY: -1,
    velocity: 0,
    handVisible: false,
    isLargeSwing: false,
    // Normalized position trail for multi-segment slice detection
    // Each entry: { x, y } in 0..1 space
    trailHistory: [],
  };
}

/**
 * Initialises MediaPipe HandLandmarker and runs per-frame inference.
 *
 * Returns a **ref** (not state) to avoid React re-renders on every frame.
 * Read `handDataRef.current` from your game loop.
 *
 * @param {React.RefObject} videoRef - video element ref
 * @param {boolean} active - whether to run tracking
 * @returns {React.RefObject} handDataRef
 */
export function useHandTracker(videoRef, active = true) {
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedRef = useRef({ x: -1, y: -1 });
  const prevSmoothedRef = useRef({ x: -1, y: -1 });
  const trailRef = useRef([]); // recent normalized positions
  const handLostCountRef = useRef(0);

  // Shared mutable ref — game loop reads this directly (no React state)
  const handDataRef = useRef(defaultHandData());

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

    // Run inference only when the video has a new frame.
    // This prevents 144Hz monitors from running MediaPipe 144 times a second and freezing the thread.
    const videoTime = video.currentTime;
    if (videoTime === lastVideoTimeRef.current || videoTime === 0) return;
    lastVideoTimeRef.current = videoTime;

    const detection = landmarker.detectForVideo(video, timestamp);
    const landmarks = detection?.landmarks?.[0];

    if (!landmarks) {
      handLostCountRef.current++;
      // Grace period: don't immediately declare hand lost
      if (handLostCountRef.current > HAND_LOST_GRACE_FRAMES) {
        prevSmoothedRef.current = { x: -1, y: -1 };
        smoothedRef.current = { x: -1, y: -1 };
        trailRef.current = [];
        handDataRef.current = defaultHandData();
      }
      return;
    }

    // Hand found — reset grace counter
    handLostCountRef.current = 0;

    const tip = landmarks[INDEX_TIP];
    const mcp = landmarks[INDEX_MCP];

    // Raw normalized coords (0-1). Mirror x for front cam.
    const rawX = 1 - tip.x;
    const rawY = tip.y;

    const prev = smoothedRef.current;
    const isFirst = prev.x === -1;

    // Compute raw velocity for adaptive smoothing decision
    const rawDx = isFirst ? 0 : rawX - prev.x;
    const rawDy = isFirst ? 0 : rawY - prev.y;
    const rawVel = Math.hypot(rawDx, rawDy);

    // Adaptive smoothing: lerp between SMOOTH_SLOW and SMOOTH_FAST based on velocity
    const velT = Math.min(1, Math.max(0, (rawVel - VEL_SLOW) / (VEL_FAST - VEL_SLOW)));
    const alpha = SMOOTH_SLOW + (SMOOTH_FAST - SMOOTH_SLOW) * velT;

    // Apply exponential smoothing (higher alpha = more responsive)
    let sx = isFirst ? rawX : alpha * rawX + (1 - alpha) * prev.x;
    let sy = isFirst ? rawY : alpha * rawY + (1 - alpha) * prev.y;

    // Smoothed velocity
    const dx = isFirst ? 0 : sx - prev.x;
    const dy = isFirst ? 0 : sy - prev.y;
    const velocity = Math.hypot(dx, dy);

    // Forward extrapolation to cancel out camera hardware latency (~30ms)
    // Only apply when moving fast to prevent jitter when still
    if (velocity > 0.01) {
      const extrapolation = Math.min(1.5, velocity * 20); 
      sx += dx * extrapolation;
      sy += dy * extrapolation;
    }

    // Large swing: MCP-to-tip length in screen space > threshold
    const swingDist = Math.hypot((1 - tip.x) - (1 - mcp.x), tip.y - mcp.y);
    const isLargeSwing = velocity > 0.012 && swingDist > 0.08;

    // Update trail history (normalized coordinates)
    const trail = trailRef.current;
    trail.push({ x: sx, y: sy });
    if (trail.length > TRAIL_HISTORY_LEN) {
      trail.splice(0, trail.length - TRAIL_HISTORY_LEN);
    }

    // Store previous smoothed position
    prevSmoothedRef.current = { x: prev.x === -1 ? sx : prev.x, y: prev.y === -1 ? sy : prev.y };
    smoothedRef.current = { x: sx, y: sy };

    // Write directly to the shared ref — no React setState
    handDataRef.current = {
      tipX: sx,
      tipY: sy,
      prevTipX: prevSmoothedRef.current.x,
      prevTipY: prevSmoothedRef.current.y,
      velocity,
      handVisible: true,
      isLargeSwing,
      trailHistory: trail.slice(), // shallow copy so consumers get a snapshot
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
