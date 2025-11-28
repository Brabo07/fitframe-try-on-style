import { useEffect, useRef, useState } from "react";
import { FaceLandmarks } from "@/hooks/useFaceTracking";
import { getFrameColorHex } from "@/data/glassesStyles";
import type { Tables } from "@/integrations/supabase/types";

// Helper function definitions from the original code (omitted for brevity)
// NOTE: Ensure 'getLensColorForFrame' and 'adjustColorOpacity' are defined or imported.

interface RealisticGlassesOverlayProps {
  landmarks: FaceLandmarks | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedProduct?: Tables<"glasses_products"> | null;
  imageSource?: HTMLImageElement | null;
}

// Frame style configurations for different shapes
const frameConfigs: Record<string, {
  lensShape: "rounded" | "rectangular" | "aviator" | "cat-eye" | "round" | "oversized" | "geometric";
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

  // Advanced smoothing with velocity tracking (Kept as is - it's good for stability)
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

  // Smooth landmarks with velocity-aware interpolation (Kept as is)
  useEffect(() => {
    if (!landmarks) {
      setSmoothedLandmarks(null);
      return;
    }

    const smoothingFactor = 0.25;
    const velocityDamping = 0.85;
    // ... (rest of the smoothing logic)
    
    // START: Smoothing Logic (omitted for brevity - keep original logic)
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
    // END: Smoothing Logic
  }, [landmarks]);

  // Render loop (Kept as is)
  useEffect(() => {
    const render = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video or image (kept as is)
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

    // Use centers from smoothedLandmarks for better stability
    const leftEyeCenter = { x: mirrorX(landmarks.leftEyeCenter.x), y: landmarks.leftEyeCenter.y };
    const rightEyeCenter = { x: mirrorX(landmarks.rightEyeCenter.x), y: landmarks.rightEyeCenter.y };
    const noseBridge = { x: mirrorX(landmarks.noseBridge.x), y: landmarks.noseBridge.y };
    // const noseTop = { x: mirrorX(landmarks.noseTop.x), y: landmarks.noseTop.y }; // Not used for glasses center

    const eyeDistance = landmarks.eyeDistance;

    // --- ADJUSTMENTS START HERE ---

    // 1. Refined Scale Factor: Use eye-to-eye distance directly for most scaling
    // Use a reference distance (e.g., 100 pixels) for relative scaling.
    // Adjusted reference (120 -> 100) and scale factor use to influence sizing.
    const referenceDistance = 100;
    const scaleFactor = eyeDistance / referenceDistance;
    
    // 2. Tighter Lens Dimensions
    // Reduced overall width multiplier (0.95 -> 0.85) to prevent overly wide frames.
    const overallFrameWidthRatio = 0.85; 
    const lensWidth = eyeDistance * overallFrameWidthRatio; 
    // Adjusted height ratio for better lens fit (0.7 -> 0.65).
    const lensHeight = lensWidth * 0.65; 
    
    // 3. More Conservative Frame Thickness
    // Made the base thickness smaller to avoid bulky frames.
    const frameThicknessBase = Math.max(2, eyeDistance * 0.05); 
    const frameThickness = frameThicknessBase * scaleFactor;
    
    // 4. Center Position: Use nose bridge for vertical anchor, eye centers for horizontal
    const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    // Anchor glasses slightly above the nose bridge point for a realistic fit.
    const centerY = noseBridge.y - eyeDistance * 0.15; // Adjusted vertical anchor

    // Vertical offset - glasses sit *relative* to the new anchor point.
    // A slight downward nudge from the eye-line (which is close to the new centerY).
    const verticalOffset = lensHeight * 0.1; 

    // Calculate rotation (Kept as is)
    const roll = landmarks.rotation.roll * (Math.PI / 180);
    const yaw = landmarks.rotation.yaw;
    const pitch = landmarks.rotation.pitch;

    // Get frame style configuration (Kept as is)
    const frameStyle = product.frame_style || "rectangular";
    const config = frameConfigs[frameStyle] || frameConfigs.rectangular;
    
    // Get colors (Kept as is)
    const frameColor = getFrameColorHex(product.frame_color);
    const lensColor = getLensColorForFrame(product.frame_color, config.lensShape);

    ctx.save();
    // 5. Apply Translation and Rotation
    // Use center point for translation, and apply offset and roll rotation.
    ctx.translate(centerX, centerY + verticalOffset);
    ctx.rotate(-roll);

    // Apply perspective based on yaw
    const yawFactor = 1 - Math.abs(yaw) * 0.015;
    // Reduced yaw offset (1.2 -> 1.0) for less horizontal shift
    const yawOffset = yaw * 1.0; 

    // Calculate lens positions
    // Reduced horizontal distance multiplier (0.52 -> 0.45) for lenses to sit closer to the eye centers.
    const lensXOffset = eyeDistance * 0.45; 
    const leftLensX = -lensXOffset + yawOffset;
    const rightLensX = lensXOffset + yawOffset;

    // Draw shadow for depth (Kept as is)
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
    // Passed the more conservative frameThickness * 0.5 for a smaller pad.
    drawNosePads(ctx, leftLensX, rightLensX, lensWidth * yawFactor, lensHeight, frameColor, frameThickness * 0.5, yaw);

    // Draw temples (arms)
    const templeLength = lensWidth * 1.0; // Reduced temple length
    drawTemples(ctx, leftLensX, rightLensX, lensWidth * yawFactor, lensHeight, templeLength, config.templeStyle, frameColor, frameThickness, yawFactor, pitch);

    ctx.restore();
  };
  
  // The rest of the helper drawing functions (drawLens, drawBridge, drawNosePads, drawTemples)
  // are assumed to be defined below (omitted for brevity, as they don't seem to be the primary issue).
  // The small changes to the input parameters (like reduced thickness and lens dimensions)
  // should cascade into these functions, improving the overall look.

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
    // ... (Original drawLens logic)
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
        // NOTE: roundRect is not standard Canvas API, assuming polyfill or similar extension
        // If not available, use basic bezier curves or fall back to rect.
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

    // Add subtle reflection (kept as is)
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

    // Draw frame (kept as is)
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
    const bridgeY = -lensHeight * 0.1; // Bridge sits slightly high on the frame
    
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
    // Pushing pads closer to the center of the face
    const leftPadX = leftX + lensWidth * 0.25; 
    const rightPadX = rightX - lensWidth * 0.25;

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
    const templeY = -lensHeight * 0.2; // Temple start height
    const leftStartX = leftX - lensWidth / 2;
    const rightStartX = rightX + lensWidth / 2;

    // Adjust temple visibility based on yaw (Kept as is)
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

// Helper functions (Kept as is - ensure these are defined in your file)
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
