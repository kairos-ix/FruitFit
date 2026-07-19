import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages the camera stream.
 * Returns { stream, videoRef, error, toggleCamera }
 */
export function useCamera(facingMode = 'user') {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    }

    try {
      const constraints = {
        video: {
          facingMode: facing,
          // Lower resolution for performance — MediaPipe internally resizes anyway.
          // 640×480 is plenty for hand detection and frees GPU/CPU for the game loop.
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setReady(true);
          setError(null);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Camera access denied');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  return { videoRef, error, ready };
}
