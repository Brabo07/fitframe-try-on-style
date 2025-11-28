import { useEffect, useRef, useState } from "react";
import { FaceLandmarks } from "@/hooks/useFaceTracking";
import { getFrameColorHex } from "@/data/glassesStyles";
import type { Tables } from "@/integrations/supabase/types";

interface RealisticGlassesOverlayProps {
  landmarks: FaceLandmarks | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedProduct?: Tables<"glasses_products"> | null;
  imageSource?: HTMLImageElement | null;
}

// Frame style configurations for different shapes
const frameConfigs: Record<string, {
  lensShape: "rounded" | "rectangular" | "aviator" | "cat-eye" | "round" | "oversized";
  bridgeStyle: "thin" | "thick" | "double";
  templeStyle: "standard" | "wide" | "thin";
}> = {
  aviator: { lensShape: "aviator", bridgeStyle: "double", templeStyle: "thin" },
  wayfarer: { lensShape: "rectangular", bridgeStyle: "thick", templeStyle: "wide" },
  cat_eye: { lensShape: "cat-eye", bridgeStyle: "thin", templeStyle: "standard" },
  round: { lensShape: "round", bridgeStyle: "thin", templeStyle: "standard" },
  rectangular: { lensShape: "rectangular", bridgeStyle: "thick", templeStyle: "standard" },
  oversized: { lensShape: "oversized", bridgeStyle: "thick", templeStyle: "wide" },
  geometric: { lensShape: "rectangular", bridgeStyle: "thin", templeStyle: "thin" },
};

const RealisticGlassesOverlay = ({
  landmarks,
  canvasRef,
  videoRef,
  selectedProduct,
  imageSource,
}: RealisticGlassesOverlayProps) => {
  const animationFrameRef = useRef<number>();
  const [smoothedLandmarks, setSmoothedLandmarks] = useState<FaceLandmarks | null>(null);
  
  // Advanced smoothing with velocity tracking
  const prevLandmarksRef = useRef<FaceLandmarks | null>(null);
  const velocityRef = useRef<{
    position: { x: number; y: number };
    rotation: { pitch: number; yaw: number; roll: number };
    scale: number;
  }>({
    position: { x: 0, y: 0 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    scale: 0,
  });

  // Smooth landmarks with velocity-aware interpolation
  useEffect(() => {
    if (!landmarks) {
      setSmoothedLandmarks(null);
      return;
    }

    const smoothingFactor = 0.25;
    const velocityDamping = 0.85;

    if (!prevLandmarksRef.current) {
      prevLandmarksRef.current = landmarks;
      setSmoothedLandmarks(landmarks);
      return;
    }

    const prev = prevLandmarksRef.current;
    
    // Calculate velocity
    const newVelocity = {
      position: {
        x: (landmarks.noseBridge.x - prev.noseBridge.x) * velocityDamping,
        y: (landmarks.noseBridge.y - prev.noseBridge.y) * velocityDamping,
      },
      rotation: {
        pitch: (landmarks.rotation.pitch - prev.rotation.pitch) * velocityDamping,
        yaw: (landmarks.rotation.yaw - prev.rotation.yaw) * velocityDamping,
        roll: (landmarks.rotation.roll - prev.rotation.roll) * velocityDamping,
      },
      scale: (landmarks.eyeDistance - prev.eyeDistance) * velocityDamping,
    };
    velocityRef.current = newVelocity;

    // Apply smoothing with velocity prediction
    const sf = smoothingFactor;
    const smoothed: FaceLandmarks = {
      leftEyeOuter: {
        x: prev.leftEyeOuter.x + sf * (landmarks.leftEyeOuter.x - prev.leftEyeOuter.x),
        y: prev.leftEyeOuter.y + sf * (landmarks.leftEyeOuter.y - prev.leftEyeOuter.y),
      },
      leftEyeInner: {
        x: prev.leftEyeInner.x + sf * (landmarks.leftEyeInner.x - prev.leftEyeInner.x),
        y: prev.leftEyeInner.y + sf * (landmarks.leftEyeInner.y - prev.leftEyeInner.y),
      },
      rightEyeOuter: {
        x: prev.rightEyeOuter.x + sf * (landmarks.rightEyeOuter.x - prev.rightEyeOuter.x),
        y: prev.rightEyeOuter.y + sf * (landmarks.rightEyeOuter.y - prev.rightEyeOuter.y),
      },
      rightEyeInner: {
        x: prev.rightEyeInner.x + sf * (landmarks.rightEyeInner.x - prev.rightEyeInner.x),
        y: prev.rightEyeInner.y + sf * (landmarks.rightEyeInner.y - prev.rightEyeInner.y),
      },
      leftEyeCenter: {
        x: prev.leftEyeCenter.x + sf * (landmarks.leftEyeCenter.x - prev.leftEyeCenter.x),
        y: prev.leftEyeCenter.y + sf * (landmarks.leftEyeCenter.y - prev.leftEyeCenter.y),
      },
      rightEyeCenter: {
        x: prev.rightEyeCenter.x + sf * (landmarks.rightEyeCenter.x - prev.rightEyeCenter.x),
        y: prev.rightEyeCenter.y + sf * (landmarks.rightEyeCenter.y - prev.rightEyeCenter.y),
      },
      noseBridge: {
        x: prev.noseBridge.x + sf * (landmarks.noseBridge.x - prev.noseBridge.x),
        y: prev.noseBridge.y + sf * (landmarks.noseBridge.y - prev.noseBridge.y),
      },
      noseTop: {
        x: prev.noseTop.x + sf * (landmarks.noseTop.x - prev.noseTop.x),
        y: prev.noseTop.y + sf * (landmarks.noseTop.y - prev.noseTop.y),
      },
      noseTip: {
        x: prev.noseTip.x + sf * (landmarks.noseTip.x - prev.noseTip.x),
        y: prev.noseTip.y + sf * (landmarks.noseTip.y - prev.noseTip.y),
        z: prev.noseTip.z + sf * (landmarks.noseTip.z - prev.noseTip.z),
      },
      leftTemple: {
        x: prev.leftTemple.x + sf * (landmarks.leftTemple.x - prev.leftTemple.x),
        y: prev.leftTemple.y + sf * (landmarks.leftTemple.y - prev.leftTemple.y),
      },
      rightTemple: {
        x: prev.rightTemple.x + sf * (landmarks.rightTemple.x - prev.rightTemple.x),
        y: prev.rightTemple.y + sf * (landmarks.rightTemple.y - prev.rightTemple.y),
      },
      faceWidth: prev.faceWidth + sf * (landmarks.faceWidth - prev.faceWidth),
      eyeDistance: prev.eyeDistance + sf * (landmarks.eyeDistance - prev.eyeDistance),
      faceDepth: prev.faceDepth + sf * (landmarks.faceDepth - prev.faceDepth),
      rotation: {
        pitch: prev.rotation.pitch + sf * (landmarks.rotation.pitch - prev.rotation.pitch),
        yaw: prev.rotation.yaw + sf * (landmarks.rotation.yaw - prev.rotation.yaw),
        roll: prev.rotation.roll + sf * (landmarks.rotation.roll - prev.rotation.roll),
      },
    };

    prevLandmarksRef.current = smoothed;
    setSmoothedLandmarks(smoothed);
  }, [landmarks]);

  useEffect(() => {
    const render = () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video or image
      if (imageSource) {
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw glasses if landmarks detected
      if (smoothedLandmarks && selectedProduct) {
        drawRealisticGlasses(ctx, smoothedLandmarks, selectedProduct);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [smoothedLandmarks, canvasRef, videoRef, selectedProduct, imageSource]);

  const drawRealisticGlasses = (
    ctx: CanvasRenderingContext2D,
    landmarks: FaceLandmarks,
    product: Tables<"glasses_products">
  ) => {
    const canvasWidth = ctx.canvas.width;
    const mirrorX = (x: number) => canvasWidth - x;

    // Get mirrored eye positions
    const leftEyeOuter = { x: mirrorX(landmarks.leftEyeOuter.x), y: landmarks.leftEyeOuter.y };
    const leftEyeInner = { x: mirrorX(landmarks.leftEyeInner.x), y: landmarks.leftEyeInner.y };
    const rightEyeOuter = { x: mirrorX(landmarks.rightEyeOuter.x), y: landmarks.rightEyeOuter.y };
    const rightEyeInner = { x: mirrorX(landmarks.rightEyeInner.x), y: landmarks.rightEyeInner.y };
    const noseBridge = { x: mirrorX(landmarks.noseBridge.x), y: landmarks.noseBridge.y };
    const noseTop = { x: mirrorX(landmarks.noseTop.x), y: landmarks.noseTop.y };

    // Calculate eye centers
    const leftEyeCenter = {
      x: (leftEyeOuter.x + leftEyeInner.x) / 2,
      y: (leftEyeOuter.y + leftEyeInner.y) / 2,
    };
    const rightEyeCenter = {
      x: (rightEyeOuter.x + rightEyeInner.x) / 2,
      y: (rightEyeOuter.y + rightEyeInner.y) / 2,
    };

    // Calculate dimensions based on face metrics
    const eyeDistance = landmarks.eyeDistance;
    const depth = landmarks.faceWidth / 200; // Depth estimation
    
    // Scale factor based on face distance from camera
    const scaleFactor = eyeDistance / 100;
    
    // Lens dimensions - adjusted for realistic proportions
    const lensWidth = eyeDistance * 0.95;
    const lensHeight = lensWidth * 0.7;
    const frameThickness = Math.max(4, eyeDistance * 0.08) * scaleFactor;
    const bridgeWidth = eyeDistance * 0.15;

    // Center position between eyes
    const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    
    // Vertical offset - glasses sit slightly below eye center
    const verticalOffset = lensHeight * 0.15;

    // Calculate rotation
    const roll = landmarks.rotation.roll * (Math.PI / 180);
    const yaw = landmarks.rotation.yaw;
    const pitch = landmarks.rotation.pitch;

    // Get frame style configuration
    const frameStyle = product.frame_style || "rectangular";
    const config = frameConfigs[frameStyle] || frameConfigs.rectangular;
    
    // Get colors
    const frameColor = getFrameColorHex(product.frame_color);
    const lensColor = getLensColorForFrame(product.frame_color, config.lensShape);

    ctx.save();
    ctx.translate(centerX, centerY + verticalOffset);
    ctx.rotate(-roll);

    // Apply perspective based on yaw
    const yawFactor = 1 - Math.abs(yaw) * 0.015;
    const yawOffset = yaw * 1.2;

    // Calculate lens positions
    const leftLensX = -eyeDistance * 0.52 + yawOffset;
    const rightLensX = eyeDistance * 0.52 + yawOffset;

    // Draw shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8 * scaleFactor;
    ctx.shadowOffsetY = 4 * scaleFactor;

    // Draw lenses with shape based on frame style
    drawLens(ctx, leftLensX, 0, lensWidth * yawFactor, lensHeight, config.lensShape, frameColor, lensColor, frameThickness, "left", yaw);
    drawLens(ctx, rightLensX, 0, lensWidth * yawFactor, lensHeight, config.lensShape, frameColor, lensColor, frameThickness, "right", yaw);

    // Reset shadow for bridge
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw nose bridge with occlusion effect
    drawBridge(ctx, leftLensX, rightLensX, lensWidth * yawFactor, lensHeight, config.bridgeStyle, frameColor, frameThickness, yaw);

    // Draw nose pads (small circles where glasses rest on nose)
    drawNosePads(ctx, leftLensX, rightLensX, lensWidth * yawFactor, lensHeight, frameColor, frameThickness * 0.5, yaw);

    // Draw temples (arms)
    const templeLength = lensWidth * 1.2;
    drawTemples(ctx, leftLensX, rightLensX, lensWidth * yawFactor, lensHeight, templeLength, config.templeStyle, frameColor, frameThickness, yawFactor, pitch);

    ctx.restore();
  };

  const drawLens = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    shape: string,
    frameColor: string,
    lensColor: string,
    thickness: number,
    side: "left" | "right",
    yaw: number
  ) => {
    ctx.beginPath();

    const halfW = width / 2;
    const halfH = height / 2;

    switch (shape) {
      case "aviator":
        // Teardrop shape
        ctx.moveTo(x - halfW * 0.7, y - halfH * 0.8);
        ctx.quadraticCurveTo(x + halfW * 0.3, y - halfH, x + halfW * 0.8, y - halfH * 0.5);
        ctx.quadraticCurveTo(x + halfW, y, x + halfW * 0.8, y + halfH * 0.7);
        ctx.quadraticCurveTo(x, y + halfH, x - halfW * 0.7, y + halfH * 0.7);
        ctx.quadraticCurveTo(x - halfW, y, x - halfW * 0.7, y - halfH * 0.8);
        break;

      case "cat-eye":
        // Upswept corners
        const catLift = side === "left" ? -halfW * 0.3 : halfW * 0.3;
        ctx.moveTo(x - halfW, y);
        ctx.quadraticCurveTo(x - halfW, y - halfH * 0.8, x - halfW * 0.3, y - halfH);
        ctx.lineTo(x + halfW * 0.3 + catLift * 0.5, y - halfH * 1.2);
        ctx.quadraticCurveTo(x + halfW + catLift, y - halfH * 0.8, x + halfW, y);
        ctx.quadraticCurveTo(x + halfW, y + halfH * 0.8, x, y + halfH);
        ctx.quadraticCurveTo(x - halfW, y + halfH * 0.8, x - halfW, y);
        break;

      case "round":
        ctx.arc(x, y, Math.min(halfW, halfH), 0, Math.PI * 2);
        break;

      case "oversized":
        // Large rounded rectangle
        const overRadius = Math.min(halfW, halfH) * 0.4;
        ctx.roundRect(x - halfW, y - halfH * 1.1, width, height * 1.2, overRadius);
        break;

      case "rectangular":
      default:
        // Slightly rounded rectangle
        const radius = Math.min(halfW, halfH) * 0.15;
        ctx.roundRect(x - halfW, y - halfH, width, height, radius);
        break;
    }

    ctx.closePath();

    // Fill lens with gradient for realism
    const gradient = ctx.createLinearGradient(x - halfW, y - halfH, x + halfW, y + halfH);
    gradient.addColorStop(0, lensColor);
    gradient.addColorStop(0.5, adjustColorOpacity(lensColor, 0.8));
    gradient.addColorStop(1, lensColor);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add subtle reflection
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    const reflectGradient = ctx.createLinearGradient(x - halfW, y - halfH, x - halfW * 0.3, y);
    reflectGradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    reflectGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = reflectGradient;
    ctx.arc(x - halfW * 0.3, y - halfH * 0.3, halfW * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw frame
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const drawBridge = (
    ctx: CanvasRenderingContext2D,
    leftX: number,
    rightX: number,
    lensWidth: number,
    lensHeight: number,
    style: string,
    color: string,
    thickness: number,
    yaw: number
  ) => {
    const leftEdge = leftX + lensWidth / 2;
    const rightEdge = rightX - lensWidth / 2;
    const bridgeY = -lensHeight * 0.1;

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";

    if (style === "double") {
      // Double bridge (aviator style)
      ctx.beginPath();
      ctx.moveTo(leftEdge, bridgeY - thickness);
      ctx.quadraticCurveTo((leftEdge + rightEdge) / 2, bridgeY - thickness * 2, rightEdge, bridgeY - thickness);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leftEdge, bridgeY + thickness);
      ctx.quadraticCurveTo((leftEdge + rightEdge) / 2, bridgeY, rightEdge, bridgeY + thickness);
      ctx.stroke();
    } else {
      // Single bridge
      ctx.beginPath();
      ctx.moveTo(leftEdge, bridgeY);
      const curveDepth = style === "thick" ? -lensHeight * 0.15 : -lensHeight * 0.08;
      ctx.quadraticCurveTo((leftEdge + rightEdge) / 2, bridgeY + curveDepth, rightEdge, bridgeY);
      ctx.stroke();
    }
  };

  const drawNosePads = (
    ctx: CanvasRenderingContext2D,
    leftX: number,
    rightX: number,
    lensWidth: number,
    lensHeight: number,
    color: string,
    size: number,
    yaw: number
  ) => {
    const padY = lensHeight * 0.3;
    const leftPadX = leftX + lensWidth * 0.35;
    const rightPadX = rightX - lensWidth * 0.35;

    ctx.fillStyle = color;
    
    // Left pad
    ctx.beginPath();
    ctx.ellipse(leftPadX, padY, size * 1.5, size, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Right pad
    ctx.beginPath();
    ctx.ellipse(rightPadX, padY, size * 1.5, size, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawTemples = (
    ctx: CanvasRenderingContext2D,
    leftX: number,
    rightX: number,
    lensWidth: number,
    lensHeight: number,
    templeLength: number,
    style: string,
    color: string,
    thickness: number,
    yawFactor: number,
    pitch: number
  ) => {
    const templeY = -lensHeight * 0.2;
    const leftStartX = leftX - lensWidth / 2;
    const rightStartX = rightX + lensWidth / 2;

    // Adjust temple visibility based on yaw
    const leftOpacity = Math.max(0.3, 1 - Math.max(0, -pitch * 0.02));
    const rightOpacity = Math.max(0.3, 1 - Math.max(0, pitch * 0.02));

    const templeWidth = style === "wide" ? thickness * 1.5 : style === "thin" ? thickness * 0.6 : thickness;

    // Left temple
    ctx.save();
    ctx.globalAlpha = leftOpacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = templeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(leftStartX, templeY);
    ctx.lineTo(leftStartX - templeLength * yawFactor, templeY + templeLength * 0.1);
    ctx.stroke();
    
    // Temple tip curl
    ctx.beginPath();
    ctx.moveTo(leftStartX - templeLength * yawFactor, templeY + templeLength * 0.1);
    ctx.quadraticCurveTo(
      leftStartX - templeLength * yawFactor - 5,
      templeY + templeLength * 0.2,
      leftStartX - templeLength * yawFactor,
      templeY + templeLength * 0.3
    );
    ctx.stroke();
    ctx.restore();

    // Right temple
    ctx.save();
    ctx.globalAlpha = rightOpacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = templeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rightStartX, templeY);
    ctx.lineTo(rightStartX + templeLength * yawFactor, templeY + templeLength * 0.1);
    ctx.stroke();

    // Temple tip curl
    ctx.beginPath();
    ctx.moveTo(rightStartX + templeLength * yawFactor, templeY + templeLength * 0.1);
    ctx.quadraticCurveTo(
      rightStartX + templeLength * yawFactor + 5,
      templeY + templeLength * 0.2,
      rightStartX + templeLength * yawFactor,
      templeY + templeLength * 0.3
    );
    ctx.stroke();
    ctx.restore();
  };

  return null;
};

// Helper functions
const getLensColorForFrame = (color: string, shape: string): string => {
  const baseColors: Record<string, string> = {
    gold: "rgba(139, 90, 43, 0.35)",
    black: "rgba(20, 20, 20, 0.45)",
    tortoise: "rgba(139, 69, 19, 0.35)",
    brown: "rgba(101, 67, 33, 0.35)",
    pink: "rgba(255, 182, 193, 0.3)",
    silver: "rgba(100, 100, 100, 0.35)",
    blue: "rgba(65, 105, 225, 0.35)",
    red: "rgba(139, 0, 0, 0.35)",
    white: "rgba(200, 200, 200, 0.25)",
    green: "rgba(34, 139, 34, 0.35)",
    purple: "rgba(128, 0, 128, 0.35)",
  };

  const normalizedColor = color.toLowerCase();
  return baseColors[normalizedColor] || "rgba(30, 30, 30, 0.4)";
};

const adjustColorOpacity = (color: string, factor: number): string => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    const r = match[1];
    const g = match[2];
    const b = match[3];
    const a = parseFloat(match[4] || "1") * factor;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return color;
};

export default RealisticGlassesOverlay;
