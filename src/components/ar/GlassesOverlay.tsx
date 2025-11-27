import { useEffect, useRef } from "react";
import { FaceLandmarks } from "@/hooks/useFaceTracking";
import { glassesTemplates, productToGlassesTemplate } from "@/data/glassesStyles";
import type { Tables } from "@/integrations/supabase/types";

interface GlassesOverlayProps {
  landmarks: FaceLandmarks | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedGlassesId: string;
  imageSource?: HTMLImageElement | null;
  // New prop for database products
  selectedProduct?: Tables<"glasses_products"> | null;
}

const GlassesOverlay = ({
  landmarks,
  canvasRef,
  videoRef,
  selectedGlassesId,
  imageSource,
  selectedProduct,
}: GlassesOverlayProps) => {
  const animationFrameRef = useRef<number>();

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
        // Mirror the video horizontally for selfie mode
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw glasses if landmarks detected
      if (landmarks) {
        drawGlasses(ctx, landmarks, selectedGlassesId, selectedProduct);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarks, canvasRef, videoRef, selectedGlassesId, imageSource, selectedProduct]);

  const drawGlasses = (
    ctx: CanvasRenderingContext2D,
    landmarks: FaceLandmarks,
    glassesId: string,
    product?: Tables<"glasses_products"> | null
  ) => {
    // Use product colors if available, otherwise fall back to demo templates
    let frameColor: string;
    let lensColor: string;
    
    if (product) {
      const template = productToGlassesTemplate(product);
      frameColor = template.frameColor;
      lensColor = template.lensColor;
    } else {
      const template = glassesTemplates[glassesId] || glassesTemplates["wayfarer-black"];
      frameColor = template.frameColor;
      lensColor = template.lensColor;
    }

    // Calculate glasses dimensions based on face landmarks
    // Mirror x coordinates for selfie mode
    const canvasWidth = ctx.canvas.width;
    const mirrorX = (x: number) => canvasWidth - x;

    const leftEyeCenter = {
      x: mirrorX((landmarks.leftEyeOuter.x + landmarks.leftEyeInner.x) / 2),
      y: (landmarks.leftEyeOuter.y + landmarks.leftEyeInner.y) / 2,
    };
    const rightEyeCenter = {
      x: mirrorX((landmarks.rightEyeOuter.x + landmarks.rightEyeInner.x) / 2),
      y: (landmarks.rightEyeOuter.y + landmarks.rightEyeInner.y) / 2,
    };

    const eyeDistance = landmarks.eyeDistance;
    const glassesWidth = eyeDistance * 2.4;
    const lensWidth = eyeDistance * 0.85;
    const lensHeight = lensWidth * 0.65;
    const bridgeWidth = eyeDistance * 0.25;
    const frameThickness = Math.max(3, eyeDistance * 0.06);

    // Calculate center and rotation
    const centerX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const centerY = (leftEyeCenter.y + rightEyeCenter.y) / 2 - lensHeight * 0.1;
    const rotation = landmarks.rotation.roll * (Math.PI / 180);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-rotation);

    // Apply 3D perspective based on yaw
    const yawFactor = 1 - Math.abs(landmarks.rotation.yaw) * 0.008;
    const yawOffset = landmarks.rotation.yaw * 0.5;

    // Draw left lens
    ctx.beginPath();
    const leftLensX = -eyeDistance * 0.55 + yawOffset;
    ctx.roundRect(
      leftLensX - (lensWidth * yawFactor) / 2,
      -lensHeight / 2,
      lensWidth * yawFactor,
      lensHeight,
      lensHeight * 0.15
    );
    ctx.fillStyle = lensColor;
    ctx.fill();
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameThickness;
    ctx.stroke();

    // Draw right lens
    ctx.beginPath();
    const rightLensX = eyeDistance * 0.55 + yawOffset;
    ctx.roundRect(
      rightLensX - (lensWidth * yawFactor) / 2,
      -lensHeight / 2,
      lensWidth * yawFactor,
      lensHeight,
      lensHeight * 0.15
    );
    ctx.fillStyle = lensColor;
    ctx.fill();
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameThickness;
    ctx.stroke();

    // Draw bridge
    ctx.beginPath();
    ctx.moveTo(leftLensX + (lensWidth * yawFactor) / 2, 0);
    ctx.quadraticCurveTo(
      yawOffset,
      -lensHeight * 0.2,
      rightLensX - (lensWidth * yawFactor) / 2,
      0
    );
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameThickness;
    ctx.stroke();

    // Draw temples (arms)
    const templeLength = lensWidth * 0.8;
    
    // Left temple
    ctx.beginPath();
    ctx.moveTo(leftLensX - (lensWidth * yawFactor) / 2, -lensHeight * 0.1);
    ctx.lineTo(
      leftLensX - (lensWidth * yawFactor) / 2 - templeLength * yawFactor,
      -lensHeight * 0.05
    );
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameThickness * 0.8;
    ctx.stroke();

    // Right temple
    ctx.beginPath();
    ctx.moveTo(rightLensX + (lensWidth * yawFactor) / 2, -lensHeight * 0.1);
    ctx.lineTo(
      rightLensX + (lensWidth * yawFactor) / 2 + templeLength * yawFactor,
      -lensHeight * 0.05
    );
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameThickness * 0.8;
    ctx.stroke();

    ctx.restore();
  };

  return null;
};

export default GlassesOverlay;
