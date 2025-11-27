import { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh, Results } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export interface FaceLandmarks {
  leftEyeOuter: { x: number; y: number };
  leftEyeInner: { x: number; y: number };
  rightEyeOuter: { x: number; y: number };
  rightEyeInner: { x: number; y: number };
  noseBridge: { x: number; y: number };
  noseTop: { x: number; y: number };
  faceWidth: number;
  eyeDistance: number;
  rotation: { pitch: number; yaw: number; roll: number };
}

interface UseFaceTrackingProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
}

// Simple smoothing using exponential moving average
class LandmarkSmoother {
  private history: FaceLandmarks[] = [];
  private readonly smoothingFactor = 0.3;

  smooth(current: FaceLandmarks): FaceLandmarks {
    if (this.history.length === 0) {
      this.history.push(current);
      return current;
    }

    const prev = this.history[this.history.length - 1];
    const smoothed: FaceLandmarks = {
      leftEyeOuter: {
        x: prev.leftEyeOuter.x + this.smoothingFactor * (current.leftEyeOuter.x - prev.leftEyeOuter.x),
        y: prev.leftEyeOuter.y + this.smoothingFactor * (current.leftEyeOuter.y - prev.leftEyeOuter.y),
      },
      leftEyeInner: {
        x: prev.leftEyeInner.x + this.smoothingFactor * (current.leftEyeInner.x - prev.leftEyeInner.x),
        y: prev.leftEyeInner.y + this.smoothingFactor * (current.leftEyeInner.y - prev.leftEyeInner.y),
      },
      rightEyeOuter: {
        x: prev.rightEyeOuter.x + this.smoothingFactor * (current.rightEyeOuter.x - prev.rightEyeOuter.x),
        y: prev.rightEyeOuter.y + this.smoothingFactor * (current.rightEyeOuter.y - prev.rightEyeOuter.y),
      },
      rightEyeInner: {
        x: prev.rightEyeInner.x + this.smoothingFactor * (current.rightEyeInner.x - prev.rightEyeInner.x),
        y: prev.rightEyeInner.y + this.smoothingFactor * (current.rightEyeInner.y - prev.rightEyeInner.y),
      },
      noseBridge: {
        x: prev.noseBridge.x + this.smoothingFactor * (current.noseBridge.x - prev.noseBridge.x),
        y: prev.noseBridge.y + this.smoothingFactor * (current.noseBridge.y - prev.noseBridge.y),
      },
      noseTop: {
        x: prev.noseTop.x + this.smoothingFactor * (current.noseTop.x - prev.noseTop.x),
        y: prev.noseTop.y + this.smoothingFactor * (current.noseTop.y - prev.noseTop.y),
      },
      faceWidth: prev.faceWidth + this.smoothingFactor * (current.faceWidth - prev.faceWidth),
      eyeDistance: prev.eyeDistance + this.smoothingFactor * (current.eyeDistance - prev.eyeDistance),
      rotation: {
        pitch: prev.rotation.pitch + this.smoothingFactor * (current.rotation.pitch - prev.rotation.pitch),
        yaw: prev.rotation.yaw + this.smoothingFactor * (current.rotation.yaw - prev.rotation.yaw),
        roll: prev.rotation.roll + this.smoothingFactor * (current.rotation.roll - prev.rotation.roll),
      },
    };

    this.history = [smoothed];
    return smoothed;
  }

  reset() {
    this.history = [];
  }
}

// MediaPipe FaceMesh landmark indices
const LANDMARKS = {
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  NOSE_BRIDGE: 6,
  NOSE_TOP: 168,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
  FOREHEAD: 10,
  CHIN: 152,
};

export const useFaceTracking = ({ videoRef, canvasRef, isActive }: UseFaceTrackingProps) => {
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const smootherRef = useRef(new LandmarkSmoother());
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());

  const calculateRotation = useCallback((landmarks: any[]) => {
    const noseBridge = landmarks[LANDMARKS.NOSE_BRIDGE];
    const noseTop = landmarks[LANDMARKS.NOSE_TOP];
    const leftEye = landmarks[LANDMARKS.LEFT_EYE_OUTER];
    const rightEye = landmarks[LANDMARKS.RIGHT_EYE_OUTER];
    const forehead = landmarks[LANDMARKS.FOREHEAD];
    const chin = landmarks[LANDMARKS.CHIN];

    // Calculate yaw (left-right rotation)
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const yaw = (noseBridge.x - eyeMidX) * 100;

    // Calculate pitch (up-down rotation)
    const faceHeight = Math.abs(forehead.y - chin.y);
    const nosePosition = (noseBridge.y - forehead.y) / faceHeight;
    const pitch = (nosePosition - 0.35) * 100;

    // Calculate roll (tilt)
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

    return { pitch, yaw, roll };
  }, []);

  const processResults = useCallback((results: Results) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Update FPS counter
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const faceLandmarks = results.multiFaceLandmarks[0];
      
      const width = canvas.width;
      const height = canvas.height;

      const rawLandmarks: FaceLandmarks = {
        leftEyeOuter: {
          x: faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].y * height,
        },
        leftEyeInner: {
          x: faceLandmarks[LANDMARKS.LEFT_EYE_INNER].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_EYE_INNER].y * height,
        },
        rightEyeOuter: {
          x: faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x * width,
          y: faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].y * height,
        },
        rightEyeInner: {
          x: faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].x * width,
          y: faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].y * height,
        },
        noseBridge: {
          x: faceLandmarks[LANDMARKS.NOSE_BRIDGE].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_BRIDGE].y * height,
        },
        noseTop: {
          x: faceLandmarks[LANDMARKS.NOSE_TOP].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_TOP].y * height,
        },
        faceWidth: Math.abs(
          faceLandmarks[LANDMARKS.FACE_LEFT].x - faceLandmarks[LANDMARKS.FACE_RIGHT].x
        ) * width,
        eyeDistance: Math.abs(
          faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x - faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x
        ) * width,
        rotation: calculateRotation(faceLandmarks),
      };

      const smoothedLandmarks = smootherRef.current.smooth(rawLandmarks);
      setLandmarks(smoothedLandmarks);
    } else {
      setLandmarks(null);
    }
  }, [canvasRef, calculateRotation]);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    const initFaceMesh = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(processResults);
        faceMeshRef.current = faceMesh;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });

          await camera.start();
          cameraRef.current = camera;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing face tracking:", err);
        setError("Failed to initialize face tracking. Please check camera permissions.");
        setIsLoading(false);
      }
    };

    initFaceMesh();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      smootherRef.current.reset();
    };
  }, [isActive, videoRef, canvasRef, processResults]);

  return { landmarks, isLoading, error, fps };
};
