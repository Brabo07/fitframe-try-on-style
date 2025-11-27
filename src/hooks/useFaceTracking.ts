import { useEffect, useRef, useState, useCallback } from "react";

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

// Advanced smoothing using exponential moving average with velocity dampening
class LandmarkSmoother {
  private history: FaceLandmarks[] = [];
  private velocity: Partial<FaceLandmarks> = {};
  private readonly smoothingFactor = 0.25; // Lower = smoother but more lag
  private readonly velocityDamping = 0.85;

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

// Load MediaPipe scripts dynamically
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const useFaceTracking = ({ videoRef, canvasRef, isActive }: UseFaceTrackingProps) => {
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const smootherRef = useRef(new LandmarkSmoother());
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const streamRef = useRef<MediaStream | null>(null);

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

  const processResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw video frame to canvas
      ctx.save();
      ctx.scale(-1, 1); // Mirror the video
      ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    
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

      // Calculate eye centers (mirror the x coordinates)
      const leftEyeCenter = {
        x: width - ((faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x + faceLandmarks[LANDMARKS.LEFT_EYE_INNER].x) / 2) * width,
        y: ((faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].y + faceLandmarks[LANDMARKS.LEFT_EYE_INNER].y) / 2) * height,
      };
      const rightEyeCenter = {
        x: width - ((faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x + faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].x) / 2) * width,
        y: ((faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].y + faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].y) / 2) * height,
      };

      // Calculate face depth based on eye distance (normalized)
      const eyeDist = Math.abs(faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x - faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x);
      const faceDepth = eyeDist * 1000; // Normalized depth estimate

      const rawLandmarks: FaceLandmarks = {
        leftEyeOuter: {
          x: width - faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_EYE_OUTER].y * height,
        },
        leftEyeInner: {
          x: width - faceLandmarks[LANDMARKS.LEFT_EYE_INNER].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_EYE_INNER].y * height,
        },
        rightEyeOuter: {
          x: width - faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].x * width,
          y: faceLandmarks[LANDMARKS.RIGHT_EYE_OUTER].y * height,
        },
        rightEyeInner: {
          x: width - faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].x * width,
          y: faceLandmarks[LANDMARKS.RIGHT_EYE_INNER].y * height,
        },
        leftEyeCenter,
        rightEyeCenter,
        noseBridge: {
          x: width - faceLandmarks[LANDMARKS.NOSE_BRIDGE].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_BRIDGE].y * height,
        },
        noseTop: {
          x: width - faceLandmarks[LANDMARKS.NOSE_TOP].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_TOP].y * height,
        },
        noseTip: {
          x: width - faceLandmarks[LANDMARKS.NOSE_TIP].x * width,
          y: faceLandmarks[LANDMARKS.NOSE_TIP].y * height,
          z: faceLandmarks[LANDMARKS.NOSE_TIP].z || 0,
        },
        leftTemple: {
          x: width - faceLandmarks[LANDMARKS.LEFT_TEMPLE].x * width,
          y: faceLandmarks[LANDMARKS.LEFT_TEMPLE].y * height,
        },
        rightTemple: {
          x: width - faceLandmarks[LANDMARKS.RIGHT_TEMPLE].x * width,
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
  }, [canvasRef, videoRef, calculateRotation]);

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    let isMounted = true;

    const initFaceMesh = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load MediaPipe scripts from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

        if (!isMounted) return;

        // Access the global objects
        const FaceMesh = (window as any).FaceMesh;
        const Camera = (window as any).Camera;

        if (!FaceMesh || !Camera) {
          throw new Error('Failed to load MediaPipe libraries');
        }

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(processResults);
        faceMeshRef.current = faceMesh;

        // Get camera stream with explicit permissions
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          
          if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            const camera = new Camera(videoRef.current, {
              onFrame: async () => {
                if (faceMeshRef.current && videoRef.current && isMounted) {
                  await faceMeshRef.current.send({ image: videoRef.current });
                }
              },
              width: 1280,
              height: 720,
            });

            await camera.start();
            cameraRef.current = camera;
          }
        } catch (camErr: any) {
          console.error("Camera error:", camErr);
          if (camErr.name === 'NotAllowedError') {
            throw new Error('Camera permission denied. Please allow camera access to use AR try-on.');
          } else if (camErr.name === 'NotFoundError') {
            throw new Error('No camera found. Please connect a camera to use AR try-on.');
          } else {
            throw new Error('Failed to access camera. Please check your camera and try again.');
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Error initializing face tracking:", err);
        if (isMounted) {
          setError(err.message || "Failed to initialize face tracking. Please check camera permissions.");
          setIsLoading(false);
        }
      }
    };

    initFaceMesh();

    return () => {
      isMounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
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
