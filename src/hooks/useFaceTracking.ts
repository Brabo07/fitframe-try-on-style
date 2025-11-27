import { useEffect, useRef, useState, useCallback } from "react";
import { FaceMesh, Results } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export interface FaceLandmarks {
  // Eye landmarks
  leftEyeOuter: { x: number; y: number };
  leftEyeInner: { x: number; y: number };
  rightEyeOuter: { x: number; y: number };
  rightEyeInner: { x: number; y: number };
  leftEyeCenter: { x: number; y: number };
  rightEyeCenter: { x: number; y: number };
  
  // Nose landmarks for bridge positioning and occlusion
  noseBridge: { x: number; y: number };
  noseTop: { x: number; y: number };
  noseTip: { x: number; y: number; z: number }; // Include Z for depth
  
  // Face metrics
  faceWidth: number;
  eyeDistance: number;
  faceDepth: number; // Estimated depth for scaling
  
  // Head rotation
  rotation: { pitch: number; yaw: number; roll: number };
  
  // Temple points for glasses arms
  leftTemple: { x: number; y: number };
  rightTemple: { x: number; y: number };
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
    const sf = this.smoothingFactor;
    
    const smoothed: FaceLandmarks = {
      leftEyeOuter: {
        x: prev.leftEyeOuter.x + sf * (current.leftEyeOuter.x - prev.leftEyeOuter.x),
        y: prev.leftEyeOuter.y + sf * (current.leftEyeOuter.y - prev.leftEyeOuter.y),
      },
      leftEyeInner: {
        x: prev.leftEyeInner.x + sf * (current.leftEyeInner.x - prev.leftEyeInner.x),
        y: prev.leftEyeInner.y + sf * (current.leftEyeInner.y - prev.leftEyeInner.y),
      },
      rightEyeOuter: {
        x: prev.rightEyeOuter.x + sf * (current.rightEyeOuter.x - prev.rightEyeOuter.x),
        y: prev.rightEyeOuter.y + sf * (current.rightEyeOuter.y - prev.rightEyeOuter.y),
      },
      rightEyeInner: {
        x: prev.rightEyeInner.x + sf * (current.rightEyeInner.x - prev.rightEyeInner.x),
        y: prev.rightEyeInner.y + sf * (current.rightEyeInner.y - prev.rightEyeInner.y),
      },
      leftEyeCenter: {
        x: prev.leftEyeCenter.x + sf * (current.leftEyeCenter.x - prev.leftEyeCenter.x),
        y: prev.leftEyeCenter.y + sf * (current.leftEyeCenter.y - prev.leftEyeCenter.y),
      },
      rightEyeCenter: {
        x: prev.rightEyeCenter.x + sf * (current.rightEyeCenter.x - prev.rightEyeCenter.x),
        y: prev.rightEyeCenter.y + sf * (current.rightEyeCenter.y - prev.rightEyeCenter.y),
      },
      noseBridge: {
        x: prev.noseBridge.x + sf * (current.noseBridge.x - prev.noseBridge.x),
        y: prev.noseBridge.y + sf * (current.noseBridge.y - prev.noseBridge.y),
      },
      noseTop: {
        x: prev.noseTop.x + sf * (current.noseTop.x - prev.noseTop.x),
        y: prev.noseTop.y + sf * (current.noseTop.y - prev.noseTop.y),
      },
      noseTip: {
        x: prev.noseTip.x + sf * (current.noseTip.x - prev.noseTip.x),
        y: prev.noseTip.y + sf * (current.noseTip.y - prev.noseTip.y),
        z: prev.noseTip.z + sf * (current.noseTip.z - prev.noseTip.z),
      },
      leftTemple: {
        x: prev.leftTemple.x + sf * (current.leftTemple.x - prev.leftTemple.x),
        y: prev.leftTemple.y + sf * (current.leftTemple.y - prev.leftTemple.y),
      },
      rightTemple: {
        x: prev.rightTemple.x + sf * (current.rightTemple.x - prev.rightTemple.x),
        y: prev.rightTemple.y + sf * (current.rightTemple.y - prev.rightTemple.y),
      },
      faceWidth: prev.faceWidth + sf * (current.faceWidth - prev.faceWidth),
      eyeDistance: prev.eyeDistance + sf * (current.eyeDistance - prev.eyeDistance),
      faceDepth: prev.faceDepth + sf * (current.faceDepth - prev.faceDepth),
      rotation: {
        pitch: prev.rotation.pitch + sf * (current.rotation.pitch - prev.rotation.pitch),
        yaw: prev.rotation.yaw + sf * (current.rotation.yaw - prev.rotation.yaw),
        roll: prev.rotation.roll + sf * (current.rotation.roll - prev.rotation.roll),
      },
    };

    this.history = [smoothed];
    return smoothed;
  }

  reset() {
    this.history = [];
  }
}

// MediaPipe FaceMesh landmark indices - comprehensive set for accurate glasses placement
const LANDMARKS = {
  // Eye corners - critical for glasses positioning
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  
  // Eye top/bottom for vertical positioning
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  
  // Nose landmarks for bridge and depth
  NOSE_BRIDGE: 6,
  NOSE_TOP: 168,
  NOSE_TIP: 4,
  NOSE_LEFT: 198,
  NOSE_RIGHT: 420,
  
  // Face boundary for scale
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
  FOREHEAD: 10,
  CHIN: 152,
  
  // Temples area for glasses arms
  LEFT_TEMPLE: 127,
  RIGHT_TEMPLE: 356,
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

      // Calculate eye centers
      const leftEyeCenter = {
        x: ((faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x + faceLandmarks[LANDMARKS.LEFT_EYE_INNER].x) / 2) * width,
        y: ((faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].y + faceLandmarks[LANDMARKS.LEFT_EYE_INNER].y) / 2) * height,
      };
      const rightEyeCenter = {
        x: ((faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x + faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].x) / 2) * width,
        y: ((faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].y + faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].y) / 2) * height,
      };

      // Calculate face depth based on eye distance (normalized)
      const eyeDist = Math.abs(faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x - faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x);
      const faceDepth = eyeDist * 1000; // Normalized depth estimate

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
        leftEyeCenter,
        rightEyeCenter,
        noseBridge: {
          x: faceLandmarks[LANDMARKS.NOSE_BRIDGE].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_BRIDGE].y * height,
        },
        noseTop: {
          x: faceLandmarks[LANDMARKS.NOSE_TOP].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_TOP].y * height,
        },
        noseTip: {
          x: faceLandmarks[LANDMARKS.NOSE_TIP].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_TIP].y * height,
          z: faceLandmarks[LANDMARKS.NOSE_TIP].z || 0,
        },
        leftTemple: {
          x: faceLandmarks[LANDMARKS.LEFT_TEMPLE].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_TEMPLE].y * height,
        },
        rightTemple: {
          x: faceLandmarks[LANDMARKS.RIGHT_TEMPLE].x * width,
          y: faceLandmarks[LANDMARKS.RIGHT_TEMPLE].y * height,
        },
        faceWidth: Math.abs(
          faceLandmarks[LANDMARKS.FACE_LEFT].x - faceLandmarks[LANDMARKS.FACE_RIGHT].x
        ) * width,
        eyeDistance: eyeDist * width,
        faceDepth,
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
