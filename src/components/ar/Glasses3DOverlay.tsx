import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Tables } from "@/integrations/supabase/types";
import { getFrameColorHex, getLensColor } from "@/data/glassesStyles";
import type { FaceLandmarks } from "@/hooks/useFaceTracking";

interface Glasses3DOverlayProps {
  faceLandmarks: FaceLandmarks | null;
  canvasWidth: number;
  canvasHeight: number;
  selectedGlassesId?: string;
  selectedProduct?: Tables<"glasses_products"> | null;
  frameStyle?: string;
}

// Smoothing class for stable positioning
class TransformSmoother {
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetRotation: THREE.Euler = new THREE.Euler();
  private targetScale: number = 1;
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentRotation: THREE.Euler = new THREE.Euler();
  private currentScale: number = 1;
  private readonly positionLerp = 0.15;
  private readonly rotationLerp = 0.12;
  private readonly scaleLerp = 0.1;

  setTarget(position: THREE.Vector3, rotation: THREE.Euler, scale: number) {
    this.targetPosition.copy(position);
    this.targetRotation.copy(rotation);
    this.targetScale = scale;
  }

  update(): { position: THREE.Vector3; rotation: THREE.Euler; scale: number } {
    // Lerp position
    this.currentPosition.lerp(this.targetPosition, this.positionLerp);
    
    // Lerp rotation (each component separately for stability)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * this.rotationLerp;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * this.rotationLerp;
    this.currentRotation.z += (this.targetRotation.z - this.currentRotation.z) * this.rotationLerp;
    
    // Lerp scale
    this.currentScale += (this.targetScale - this.currentScale) * this.scaleLerp;

    return {
      position: this.currentPosition.clone(),
      rotation: this.currentRotation.clone(),
      scale: this.currentScale
    };
  }

  reset() {
    this.currentPosition.set(0, 0, 0);
    this.currentRotation.set(0, 0, 0);
    this.currentScale = 1;
  }
}

// 3D Glasses Model Component with improved rendering
const GlassesModel = ({ 
  smoother,
  frameColor, 
  lensColor,
  frameStyle 
}: { 
  smoother: TransformSmoother;
  frameColor: string;
  lensColor: string;
  frameStyle: string;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate smoothly each frame
  useFrame(() => {
    if (groupRef.current) {
      const { position, rotation, scale } = smoother.update();
      groupRef.current.position.copy(position);
      groupRef.current.rotation.copy(rotation);
      groupRef.current.scale.setScalar(scale);
    }
  });
  
  // Create frame material with better appearance
  const frameMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColor),
      metalness: 0.4,
      roughness: 0.3,
      envMapIntensity: 0.5,
    }), [frameColor]
  );

  // Create lens material with realistic transparency
  const lensMaterial = useMemo(() => {
    const color = new THREE.Color(lensColor);
    return new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      metalness: 0.0,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 0.5,
      side: THREE.DoubleSide,
    });
  }, [lensColor]);

  // Frame dimensions based on style
  const dims = useMemo(() => {
    switch (frameStyle) {
      case 'aviator':
        return { lensWidth: 0.52, lensHeight: 0.38, bridgeWidth: 0.16, frameThickness: 0.022, lensGap: 0.38 };
      case 'wayfarer':
        return { lensWidth: 0.48, lensHeight: 0.40, bridgeWidth: 0.14, frameThickness: 0.038, lensGap: 0.36 };
      case 'cat_eye':
        return { lensWidth: 0.50, lensHeight: 0.34, bridgeWidth: 0.12, frameThickness: 0.032, lensGap: 0.34 };
      case 'round':
        return { lensWidth: 0.40, lensHeight: 0.40, bridgeWidth: 0.12, frameThickness: 0.028, lensGap: 0.32 };
      case 'rectangular':
        return { lensWidth: 0.52, lensHeight: 0.30, bridgeWidth: 0.14, frameThickness: 0.032, lensGap: 0.36 };
      case 'oversized':
        return { lensWidth: 0.62, lensHeight: 0.48, bridgeWidth: 0.16, frameThickness: 0.038, lensGap: 0.40 };
      default:
        return { lensWidth: 0.48, lensHeight: 0.38, bridgeWidth: 0.14, frameThickness: 0.030, lensGap: 0.36 };
    }
  }, [frameStyle]);

  // Create lens geometry based on style
  const createLensGeometry = (isRight: boolean) => {
    if (frameStyle === 'round') {
      return new THREE.CircleGeometry(dims.lensWidth / 2, 48);
    } else if (frameStyle === 'aviator') {
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      shape.moveTo(0, h * 0.9);
      shape.bezierCurveTo(w * 0.9, h, w, h * 0.4, w, 0);
      shape.bezierCurveTo(w, -h * 0.7, w * 0.6, -h, 0, -h * 1.05);
      shape.bezierCurveTo(-w * 0.6, -h, -w, -h * 0.7, -w, 0);
      shape.bezierCurveTo(-w, h * 0.4, -w * 0.9, h, 0, h * 0.9);
      return new THREE.ShapeGeometry(shape, 24);
    } else if (frameStyle === 'cat_eye') {
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      const tilt = isRight ? 1 : -1;
      shape.moveTo(-w, 0);
      shape.bezierCurveTo(-w, h * 0.85, -w * 0.4, h * 1.1, w * 0.2, h * (1 + tilt * 0.25));
      shape.lineTo(w, h * (0.7 + tilt * 0.35));
      shape.bezierCurveTo(w * 1.05, h * 0.2, w * 1.05, -h * 0.4, w, -h * 0.75);
      shape.bezierCurveTo(w * 0.5, -h * 0.95, -w * 0.5, -h * 0.95, -w, -h * 0.75);
      shape.bezierCurveTo(-w * 1.05, -h * 0.2, -w * 1.05, h * 0.3, -w, 0);
      return new THREE.ShapeGeometry(shape, 24);
    } else {
      // Rounded rectangle
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      const r = Math.min(w, h) * (frameStyle === 'rectangular' ? 0.15 : 0.25);
      shape.moveTo(-w + r, h);
      shape.lineTo(w - r, h);
      shape.quadraticCurveTo(w, h, w, h - r);
      shape.lineTo(w, -h + r);
      shape.quadraticCurveTo(w, -h, w - r, -h);
      shape.lineTo(-w + r, -h);
      shape.quadraticCurveTo(-w, -h, -w, -h + r);
      shape.lineTo(-w, h - r);
      shape.quadraticCurveTo(-w, h, -w + r, h);
      return new THREE.ShapeGeometry(shape, 16);
    }
  };

  // Create frame ring for each lens
  const createFrameRing = () => {
    if (frameStyle === 'round') {
      return <torusGeometry args={[dims.lensWidth / 2, dims.frameThickness, 12, 64]} />;
    }
    // For other styles, use extruded shape
    return <torusGeometry args={[dims.lensWidth / 2.2, dims.frameThickness, 12, 48]} />;
  };

  const leftLensX = -dims.lensGap;
  const rightLensX = dims.lensGap;

  return (
    <group ref={groupRef}>
      {/* Left Lens */}
      <mesh position={[leftLensX, 0, 0]} material={lensMaterial}>
        <primitive object={createLensGeometry(false)} attach="geometry" />
      </mesh>
      
      {/* Left Frame Ring */}
      <mesh position={[leftLensX, 0, 0.005]} material={frameMaterial}>
        {createFrameRing()}
      </mesh>

      {/* Right Lens */}
      <mesh position={[rightLensX, 0, 0]} material={lensMaterial}>
        <primitive object={createLensGeometry(true)} attach="geometry" />
      </mesh>
      
      {/* Right Frame Ring */}
      <mesh position={[rightLensX, 0, 0.005]} material={frameMaterial}>
        {createFrameRing()}
      </mesh>

      {/* Bridge - top bar */}
      <mesh position={[0, 0.03, 0.015]} material={frameMaterial}>
        <boxGeometry args={[dims.bridgeWidth * 1.8, dims.frameThickness * 1.3, dims.frameThickness]} />
      </mesh>
      
      {/* Bridge - nose piece */}
      <mesh position={[0, -0.03, 0.025]} rotation={[Math.PI / 2, 0, 0]} material={frameMaterial}>
        <torusGeometry args={[0.06, dims.frameThickness * 0.7, 8, 16, Math.PI]} />
      </mesh>

      {/* Nose pads */}
      <mesh position={[-0.05, -0.06, 0.02]} rotation={[0.3, 0.2, 0]} material={frameMaterial}>
        <boxGeometry args={[0.03, 0.02, 0.01]} />
      </mesh>
      <mesh position={[0.05, -0.06, 0.02]} rotation={[0.3, -0.2, 0]} material={frameMaterial}>
        <boxGeometry args={[0.03, 0.02, 0.01]} />
      </mesh>

      {/* Left Temple (arm) */}
      <group position={[leftLensX - dims.lensWidth / 2 - 0.02, 0.04, 0]}>
        {/* Hinge */}
        <mesh position={[0, 0, -0.01]} material={frameMaterial}>
          <boxGeometry args={[0.04, dims.frameThickness * 1.5, 0.03]} />
        </mesh>
        {/* Temple arm */}
        <mesh position={[-0.01, 0, -0.18]} rotation={[0, 0.12, 0]} material={frameMaterial}>
          <boxGeometry args={[dims.frameThickness * 1.2, dims.frameThickness * 1.1, 0.32]} />
        </mesh>
        {/* Temple tip (curved end) */}
        <mesh position={[-0.04, -0.02, -0.35]} rotation={[0.25, 0.1, 0]} material={frameMaterial}>
          <boxGeometry args={[dims.frameThickness, dims.frameThickness * 0.9, 0.06]} />
        </mesh>
      </group>

      {/* Right Temple (arm) */}
      <group position={[rightLensX + dims.lensWidth / 2 + 0.02, 0.04, 0]}>
        {/* Hinge */}
        <mesh position={[0, 0, -0.01]} material={frameMaterial}>
          <boxGeometry args={[0.04, dims.frameThickness * 1.5, 0.03]} />
        </mesh>
        {/* Temple arm */}
        <mesh position={[0.01, 0, -0.18]} rotation={[0, -0.12, 0]} material={frameMaterial}>
          <boxGeometry args={[dims.frameThickness * 1.2, dims.frameThickness * 1.1, 0.32]} />
        </mesh>
        {/* Temple tip (curved end) */}
        <mesh position={[0.04, -0.02, -0.35]} rotation={[0.25, -0.1, 0]} material={frameMaterial}>
          <boxGeometry args={[dims.frameThickness, dims.frameThickness * 0.9, 0.06]} />
        </mesh>
      </group>
    </group>
  );
};

// Scene component with improved tracking
const Scene = ({ 
  faceLandmarks, 
  canvasWidth, 
  canvasHeight, 
  frameColor, 
  lensColor,
  frameStyle 
}: { 
  faceLandmarks: FaceLandmarks | null;
  canvasWidth: number;
  canvasHeight: number;
  frameColor: string;
  lensColor: string;
  frameStyle: string;
}) => {
  const { camera } = useThree();
  const smootherRef = useRef(new TransformSmoother());
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.z = 5;
      camera.fov = 45;
      camera.updateProjectionMatrix();
    }
    setIsReady(true);
  }, [camera]);

  // Update target transform when landmarks change
  useEffect(() => {
    if (!faceLandmarks) return;

    // Calculate center position between eyes (use nose bridge for more stability)
    const centerX = faceLandmarks.noseBridge.x;
    const centerY = (faceLandmarks.leftEyeCenter.y + faceLandmarks.rightEyeCenter.y) / 2;
    
    // Eye distance for scaling
    const eyeDistance = faceLandmarks.eyeDistance;

    // Convert screen coordinates to 3D world coordinates
    // Map screen space to normalized device coordinates
    const normalizedX = ((centerX / canvasWidth) - 0.5) * 4.2;
    const normalizedY = -((centerY / canvasHeight) - 0.5) * 3.2;
    
    // Scale based on eye distance with better calibration
    const baseScale = (eyeDistance / canvasWidth) * 13;
    
    // Calculate rotation from face landmarks (with dampening)
    const yaw = (faceLandmarks.rotation.yaw || 0) * 0.012;
    const pitch = (faceLandmarks.rotation.pitch || 0) * 0.008;
    const roll = (faceLandmarks.rotation.roll || 0) * (Math.PI / 180);

    // Calculate depth based on face size
    const zPosition = 1.8 - (eyeDistance / canvasWidth) * 2.5;

    // Set the target transform for smooth interpolation
    smootherRef.current.setTarget(
      new THREE.Vector3(normalizedX, normalizedY + 0.05, zPosition),
      new THREE.Euler(pitch, yaw, roll),
      baseScale
    );
  }, [faceLandmarks, canvasWidth, canvasHeight]);

  if (!isReady || !faceLandmarks) return null;

  return (
    <>
      {/* Improved lighting setup */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 5]} intensity={0.7} castShadow />
      <directionalLight position={[-3, 2, 5]} intensity={0.4} />
      <pointLight position={[0, 1, 4]} intensity={0.3} />
      <hemisphereLight args={['#ffffff', '#444444', 0.4]} />

      {/* 3D Glasses with smoother */}
      <GlassesModel
        smoother={smootherRef.current}
        frameColor={frameColor}
        lensColor={lensColor}
        frameStyle={frameStyle}
      />
    </>
  );
};

const Glasses3DOverlay = ({
  faceLandmarks,
  canvasWidth,
  canvasHeight,
  selectedGlassesId,
  selectedProduct,
  frameStyle = "wayfarer"
}: Glasses3DOverlayProps) => {
  // Determine frame and lens colors
  const frameColor = selectedProduct 
    ? getFrameColorHex(selectedProduct.frame_color)
    : "#1a1a1a";
  
  const lensColor = selectedProduct
    ? getLensColor(selectedProduct.frame_color)
    : "#4a90d9";

  const actualFrameStyle = selectedProduct?.frame_style || frameStyle;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <Canvas
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
        gl={{ 
          alpha: true, 
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
      >
        <Scene
          faceLandmarks={faceLandmarks}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          frameColor={frameColor}
          lensColor={lensColor}
          frameStyle={actualFrameStyle}
        />
      </Canvas>
    </div>
  );
};

export default Glasses3DOverlay;
