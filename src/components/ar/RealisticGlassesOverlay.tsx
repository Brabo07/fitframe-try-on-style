import { useEffect, useRef, useState, useMemo } from "react";
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

/**
 * Style-specific calibration multipliers.
 * These tune the frame width relative to eye distance for realistic fit.
 * You can tweak per your catalog measurements.
 */
const STYLE_SCALE: Record<string, number> = {
  aviator: 2.20,
  wayfarer: 2.10,
  cat_eye: 2.25,
  round: 2.05,
  rectangular: 2.10,
  oversized: 2.40,
  geometric: 2.10,
  default: 2.12,
};

/**
 * Smoother for position, scale, and rotation to reduce jitter.
 */
class PoseSmoother {
  private prev: { x: number; y: number; w: number; h: number; rot: number } | null = null;
  constructor(private alpha = 0.25) {}
  smooth(x: number, y: number, w: number, h: number, rot: number) {
    if (!this.prev) {
      this.prev = { x, y, w, h, rot };
      return this.prev;
    }
    const a = this.alpha;
    this.prev = {
      x: a * x + (1 - a) * this.prev.x,
      y: a * y + (1 - a) * this.prev.y,
      w: a * w + (1 - a) * this.prev.w,
      h: a * h + (1 - a) * this.prev.h,
      rot: a * rot + (1 - a) * this.prev.rot,
    };
    return this.prev;
  }
}

const RealisticGlassesOverlay = ({
  landmarks,
  canvasRef,
  videoRef,
  selectedProduct,
  imageSource,
}: RealisticGlassesOverlayProps) => {
  const animationFrameRef = useRef<number>();
  const [smoothedLandmarks, setSmoothedLandmarks] = useState<FaceLandmarks | null>(null);
  const poseSmoother = useMemo(() => new PoseSmoother(0.25), []);

  // Velocity-aware smoothing of landmarks from useFaceTracking
  const prevRef = useRef<FaceLandmarks | null>(null);
  useEffect(() => {
    if (!landmarks) {
      setSmoothedLandmarks(null);
      prevRef.current = null;
      return;
    }
    const sf = 0.25;
    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = landmarks;
      setSmoothedLandmarks(landmarks);
      return;
    }
    const lerp = (p: { x: number; y: number }, q: { x: number; y: number }) => ({
      x: prev ? p.x + sf * (q.x - p.x) : q.x,
      y: prev ? p.y + sf * (q.y - p.y) : q.y,
    });

    const smoothed: FaceLandmarks = {
      leftEyeOuter: lerp(prev.leftEyeOuter, landmarks.leftEyeOuter),
      leftEyeInner: lerp(prev.leftEyeInner, landmarks.leftEyeInner),
      rightEyeOuter: lerp(prev.rightEyeOuter, landmarks.rightEyeOuter),
      rightEyeInner: lerp(prev.rightEyeInner, landmarks.rightEyeInner),
      leftEyeCenter: lerp(prev.leftEyeCenter, landmarks.leftEyeCenter),
      rightEyeCenter: lerp(prev.rightEyeCenter, landmarks.rightEyeCenter),
      noseBridge: lerp(prev.noseBridge, landmarks.noseBridge),
      noseTop: lerp(prev.noseTop, landmarks.noseTop),
      noseTip: {
        x: prev.noseTip.x + sf * (landmarks.noseTip.x - prev.noseTip.x),
        y: prev.noseTip.y + sf * (landmarks.noseTip.y - prev.noseTip.y),
        z: prev.noseTip.z + sf * (landmarks.noseTip.z - prev.noseTip.z),
      },
      leftTemple: lerp(prev.leftTemple, landmarks.leftTemple),
      rightTemple: lerp(prev.rightTemple, landmarks.rightTemple),
      faceWidth: prev.faceWidth + sf * (landmarks.faceWidth - prev.faceWidth),
      eyeDistance: prev.eyeDistance + sf * (landmarks.eyeDistance - prev.eyeDistance),
      faceDepth: prev.faceDepth + sf * (landmarks.faceDepth - prev.faceDepth),
      rotation: {
        pitch: prev.rotation.pitch + sf * (landmarks.rotation.pitch - prev.rotation.pitch),
        yaw: prev.rotation.yaw + sf * (landmarks.rotation.yaw - prev.rotation.yaw),
        roll: prev.rotation.roll + sf * (landmarks.rotation.roll - prev.rotation.roll),
      },
    };

    prevRef.current = smoothed;
    setSmoothedLandmarks(smoothed);
  }, [landmarks]);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw source
      if (imageSource) {
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // mirror video for front camera UX
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw glasses
      if (smoothedLandmarks && selectedProduct) {
        drawFittedFrame(ctx, smoothedLandmarks, selectedProduct);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [smoothedLandmarks, canvasRef, videoRef, selectedProduct, imageSource]);

  function drawFittedFrame(
    ctx: CanvasRenderingContext2D,
    lm: FaceLandmarks,
    product: Tables<"glasses_products">
  ) {
    const canvasW = ctx.canvas.width;

    // Because the background video is mirrored, we mirror X for landmarks to match canvas pixels.
    const mx = (x: number) => canvasW - x;

    const leftCenter = { x: mx(lm.leftEyeCenter.x), y: lm.leftEyeCenter.y };
    const rightCenter = { x: mx(lm.rightEyeCenter.x), y: lm.rightEyeCenter.y };
    const mid = { x: (leftCenter.x + rightCenter.x) / 2, y: (leftCenter.y + rightCenter.y) / 2 };

    // Eye distance in canvas pixels
    const eyeDist = Math.hypot(rightCenter.x - leftCenter.x, rightCenter.y - leftCenter.y);

    // Rotation from eye line; roll comes from landmarks (deg → rad)
    const rollRad = (lm.rotation.roll || 0) * Math.PI / 180;

    // Calibrated frame width from style
    const styleKey = (product.frame_style || "default").toLowerCase();
    const widthMul = STYLE_SCALE[styleKey] ?? STYLE_SCALE.default;
    const targetW = eyeDist * widthMul;

    // Target height from image aspect if we render an image, else proportion
    const aspectGuess = 2.0; // typical frame image wider than tall; tune if you load product image
    const targetH = targetW / aspectGuess;

    // Vertical offset so glasses sit slightly below eye mid
    const offsetY = targetH * 0.12;

    // Smooth pose
    const s = poseSmoother.smooth(mid.x, mid.y + offsetY, targetW, targetH, -rollRad);

    // Colors
    const frameColor = getFrameColorHex(product.frame_color);
    const lensColor = lensTint(product.frame_color);

    // Yaw-based perspective compression
    const yaw = lm.rotation.yaw || 0;
    const yawFactor = 1 - Math.min(0.5, Math.abs(yaw) * 0.015);
    const yawOffset = yaw * 1.0;

    // Lens sizes
    const lensW = s.w * 0.42 * yawFactor;
    const lensH = lensW * 0.72;
    const bridgeGap = s.w * 0.10;

    // Left/right lens centers relative to mid
    const leftX = -bridgeGap / 2 - lensW / 2 + yawOffset;
    const rightX = bridgeGap / 2 + lensW / 2 + yawOffset;

    // Frame stroke thickness relative to scale
    const thickness = Math.max(2, s.w * 0.015);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);

    // Subtle drop shadow to anchor
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = Math.max(4, s.w * 0.01);
    ctx.shadowOffsetY = Math.max(2, s.w * 0.005);

    // Draw lenses as rounded rects
    drawLens(ctx, leftX, 0, lensW, lensH, lensColor, frameColor, thickness);
    drawLens(ctx, rightX, 0, lensW, lensH, lensColor, frameColor, thickness);

    // Reset shadow for bridge
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Bridge
    drawBridge(ctx, leftX + lensW / 2, rightX - lensW / 2, lensH, frameColor, thickness);

    // Nose pads
    drawNosePads(ctx, leftX, rightX, lensW, lensH, frameColor, thickness * 0.6);

    // Temples (simple stylized lines)
    drawTemples(ctx, leftX, rightX, lensW, lensH, s.w, frameColor, thickness, yawFactor);

    ctx.restore();
  }

  function drawLens(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    lensColor: string,
    frameColor: string,
    thickness: number
  ) {
    const radius = Math.min(w, h) * 0.18;

    // Lens fill with gradient
    const grad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    grad.addColorStop(0, lensColor);
    grad.addColorStop(0.6, adjustOpacity(lensColor, 0.75));
    grad.addColorStop(1, lensColor);

    ctx.beginPath();
    // @ts-ignore: roundRect exists in modern Canvas
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, radius);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Reflection highlight
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.25, cy - h * 0.25, w * 0.35, h * 0.25, Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();

    // Frame stroke
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function drawBridge(
    ctx: CanvasRenderingContext2D,
    leftEdgeX: number,
    rightEdgeX: number,
    lensH: number,
    color: string,
    thickness: number
  ) {
    const y = -lensH * 0.12;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(leftEdgeX, y);
    ctx.quadraticCurveTo((leftEdgeX + rightEdgeX) / 2, y - lensH * 0.15, rightEdgeX, y);
    ctx.stroke();
  }

  function drawNosePads(
    ctx: CanvasRenderingContext2D,
    leftCx: number,
    rightCx: number,
    lensW: number,
    lensH: number,
    color: string,
    size: number
  ) {
    const padY = lensH * 0.28;
    const leftPx = leftCx + lensW * 0.30;
    const rightPx = rightCx - lensW * 0.30;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(leftPx, padY, size * 1.2, size * 0.9, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(rightPx, padY, size * 1.2, size * 0.9, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTemples(
    ctx: CanvasRenderingContext2D,
    leftCx: number,
    rightCx: number,
    lensW: number,
    lensH: number,
    frameW: number,
    color: string,
    thickness: number,
    yawFactor: number
  ) {
    const y = -lensH * 0.20;
    const leftStartX = leftCx - lensW / 2;
    const rightStartX = rightCx + lensW / 2;

    const templeLen = frameW * 0.55 * yawFactor;
    const templeWidth = thickness * 0.9;

    ctx.strokeStyle = color;
    ctx.lineWidth = templeWidth;
    ctx.lineCap = "round";

    // Left temple
    ctx.beginPath();
    ctx.moveTo(leftStartX, y);
    ctx.lineTo(leftStartX - templeLen, y + templeLen * 0.08);
    ctx.stroke();

    // Right temple
    ctx.beginPath();
    ctx.moveTo(rightStartX, y);
    ctx.lineTo(rightStartX + templeLen, y + templeLen * 0.08);
    ctx.stroke();
  }

  function lensTint(frameColor: string) {
    const base: Record<string, string> = {
      gold: "rgba(139, 90, 43, 0.28)",
      black: "rgba(20, 20, 20, 0.40)",
      tortoise: "rgba(139, 69, 19, 0.30)",
      brown: "rgba(101, 67, 33, 0.30)",
      pink: "rgba(255, 182, 193, 0.25)",
      silver: "rgba(120, 120, 120, 0.30)",
      blue: "rgba(65, 105, 225, 0.28)",
      red: "rgba(139, 0, 0, 0.28)",
      white: "rgba(220, 220, 220, 0.20)",
      green: "rgba(34, 139, 34, 0.28)",
      purple: "rgba(128, 0, 128, 0.28)",
    };
    const key = (frameColor || "").toLowerCase();
    return base[key] || "rgba(30, 30, 30, 0.32)";
  }

  function adjustOpacity(rgba: string, factor: number) {
    const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return rgba;
    const [_, r, g, b, a] = m;
    const alpha = Math.max(0, Math.min(1, (a ? parseFloat(a) : 1) * factor));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return null;
};

export default RealisticGlassesOverlay;
