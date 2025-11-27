import { useRef, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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

// 3D Glasses Model Component
const GlassesModel = ({ 
  position, 
  rotation, 
  scale, 
  frameColor, 
  lensColor,
  frameStyle 
}: { 
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  frameColor: string;
  lensColor: string;
  frameStyle: string;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create frame material
  const frameMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColor),
      metalness: 0.3,
      roughness: 0.4,
    }), [frameColor]
  );

  // Create lens material with transparency
  const lensMaterial = useMemo(() => {
    const color = new THREE.Color(lensColor);
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      metalness: 0.1,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
  }, [lensColor]);

  // Frame dimensions based on style
  const getFrameDimensions = () => {
    switch (frameStyle) {
      case 'aviator':
        return { lensWidth: 0.5, lensHeight: 0.35, bridgeWidth: 0.15, frameThickness: 0.025 };
      case 'wayfarer':
        return { lensWidth: 0.45, lensHeight: 0.38, bridgeWidth: 0.12, frameThickness: 0.04 };
      case 'cat_eye':
        return { lensWidth: 0.48, lensHeight: 0.32, bridgeWidth: 0.1, frameThickness: 0.035 };
      case 'round':
        return { lensWidth: 0.38, lensHeight: 0.38, bridgeWidth: 0.1, frameThickness: 0.03 };
      case 'rectangular':
        return { lensWidth: 0.5, lensHeight: 0.28, bridgeWidth: 0.12, frameThickness: 0.035 };
      case 'oversized':
        return { lensWidth: 0.6, lensHeight: 0.45, bridgeWidth: 0.14, frameThickness: 0.04 };
      default:
        return { lensWidth: 0.45, lensHeight: 0.35, bridgeWidth: 0.12, frameThickness: 0.03 };
    }
  };

  const dims = getFrameDimensions();

  // Create lens geometry based on style
  const createLensGeometry = (isRight: boolean) => {
    if (frameStyle === 'round') {
      return new THREE.CircleGeometry(dims.lensWidth / 2, 32);
    } else if (frameStyle === 'aviator') {
      // Teardrop shape for aviator
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      shape.moveTo(0, h);
      shape.bezierCurveTo(w * 0.8, h, w, h * 0.5, w, 0);
      shape.bezierCurveTo(w, -h * 0.8, w * 0.6, -h, 0, -h * 1.1);
      shape.bezierCurveTo(-w * 0.6, -h, -w, -h * 0.8, -w, 0);
      shape.bezierCurveTo(-w, h * 0.5, -w * 0.8, h, 0, h);
      return new THREE.ShapeGeometry(shape);
    } else if (frameStyle === 'cat_eye') {
      // Cat eye shape
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      const tilt = isRight ? 1 : -1;
      shape.moveTo(-w, 0);
      shape.bezierCurveTo(-w, h * 0.9, -w * 0.3, h * 1.2, w * 0.3, h * (1 + tilt * 0.3));
      shape.lineTo(w, h * (0.8 + tilt * 0.4));
      shape.bezierCurveTo(w * 1.1, h * 0.3, w * 1.1, -h * 0.5, w, -h * 0.8);
      shape.bezierCurveTo(w * 0.5, -h, -w * 0.5, -h, -w, -h * 0.8);
      shape.bezierCurveTo(-w * 1.1, -h * 0.3, -w * 1.1, h * 0.3, -w, 0);
      return new THREE.ShapeGeometry(shape);
    } else {
      // Rounded rectangle for most styles
      const shape = new THREE.Shape();
      const w = dims.lensWidth / 2;
      const h = dims.lensHeight / 2;
      const r = Math.min(w, h) * 0.3;
      shape.moveTo(-w + r, h);
      shape.lineTo(w - r, h);
      shape.quadraticCurveTo(w, h, w, h - r);
      shape.lineTo(w, -h + r);
      shape.quadraticCurveTo(w, -h, w - r, -h);
      shape.lineTo(-w + r, -h);
      shape.quadraticCurveTo(-w, -h, -w, -h + r);
      shape.lineTo(-w, h - r);
      shape.quadraticCurveTo(-w, h, -w + r, h);
      return new THREE.ShapeGeometry(shape);
    }
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Left Lens */}
      <mesh position={[-0.35, 0, 0]} material={lensMaterial}>
        <primitive object={createLensGeometry(false)} attach="geometry" />
      </mesh>
      
      {/* Left Frame */}
      <mesh position={[-0.35, 0, 0.01]} material={frameMaterial}>
        <torusGeometry args={[dims.lensWidth / 2, dims.frameThickness, 8, 64]} />
      </mesh>

      {/* Right Lens */}
      <mesh position={[0.35, 0, 0]} material={lensMaterial}>
        <primitive object={createLensGeometry(true)} attach="geometry" />
      </mesh>
      
      {/* Right Frame */}
      <mesh position={[0.35, 0, 0.01]} material={frameMaterial}>
        <torusGeometry args={[dims.lensWidth / 2, dims.frameThickness, 8, 64]} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, 0.02, 0.02]} rotation={[0, 0, 0]} material={frameMaterial}>
        <boxGeometry args={[dims.bridgeWidth * 2, dims.frameThickness * 1.5, dims.frameThickness]} />
      </mesh>
      
      {/* Bridge curve */}
      <mesh position={[0, -0.02, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={frameMaterial}>
        <torusGeometry args={[0.08, dims.frameThickness * 0.8, 8, 16, Math.PI]} />
      </mesh>

      {/* Left Temple */}
      <group position={[-0.55, 0.05, 0]}>
        <mesh position={[0, 0, -0.15]} rotation={[0, Math.PI / 2 - 0.15, 0]} material={frameMaterial}>
          <boxGeometry args={[0.35, dims.frameThickness * 1.2, dims.frameThickness]} />
        </mesh>
        {/* Temple tip */}
        <mesh position={[-0.02, -0.02, -0.32]} rotation={[0.2, Math.PI / 2, 0]} material={frameMaterial}>
          <boxGeometry args={[0.08, dims.frameThickness, dims.frameThickness * 0.8]} />
        </mesh>
      </group>

      {/* Right Temple */}
      <group position={[0.55, 0.05, 0]}>
        <mesh position={[0, 0, -0.15]} rotation={[0, -Math.PI / 2 + 0.15, 0]} material={frameMaterial}>
          <boxGeometry args={[0.35, dims.frameThickness * 1.2, dims.frameThickness]} />
        </mesh>
        {/* Temple tip */}
        <mesh position={[0.02, -0.02, -0.32]} rotation={[0.2, -Math.PI / 2, 0]} material={frameMaterial}>
          <boxGeometry args={[0.08, dims.frameThickness, dims.frameThickness * 0.8]} />
        </mesh>
      </group>
    </group>
  );
};

// Scene component that handles the 3D rendering
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
  
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.z = 5;
      camera.fov = 45;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  if (!faceLandmarks) return null;

  // Convert 2D face landmarks to 3D position using eyeDistance from landmarks
  const eyeDistance = faceLandmarks.eyeDistance;

  // Calculate center position between eyes
  const centerX = (faceLandmarks.leftEyeCenter.x + faceLandmarks.rightEyeCenter.x) / 2;
  const centerY = (faceLandmarks.leftEyeCenter.y + faceLandmarks.rightEyeCenter.y) / 2;

  // Convert screen coordinates to 3D world coordinates
  const normalizedX = ((centerX / canvasWidth) - 0.5) * 4;
  const normalizedY = -((centerY / canvasHeight) - 0.5) * 3;
  
  // Scale based on eye distance (larger distance = closer to camera = larger glasses)
  const baseScale = eyeDistance / canvasWidth * 12;
  
  // Calculate rotation from face landmarks
  const yaw = faceLandmarks.rotation.yaw || 0;
  const pitch = faceLandmarks.rotation.pitch || 0;
  const roll = faceLandmarks.rotation.roll || 0;

  // Calculate depth (z position) based on face size
  const zPosition = 2 - (eyeDistance / canvasWidth) * 3;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 5]} intensity={0.8} />
      <directionalLight position={[-2, 2, 5]} intensity={0.4} />
      <pointLight position={[0, 0, 4]} intensity={0.3} />

      {/* 3D Glasses */}
      <GlassesModel
        position={[normalizedX, normalizedY, zPosition]}
        rotation={[pitch * 0.5, yaw * 0.8, roll]}
        scale={baseScale}
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
          preserveDrawingBuffer: true
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
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
