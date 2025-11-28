// src/components/ARTryOn.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCw, Download, Share2, Upload, Loader2, ShoppingCart, Box, Layers } from "lucide-react";
import { toast } from "sonner";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import RealisticGlassesOverlay from "@/components/ar/RealisticGlassesOverlay";
import Glasses3DOverlay from "@/components/ar/Glasses3DOverlay";
import GlassesCarousel from "@/components/ar/GlassesCarousel";
import ProductGlassesCarousel from "@/components/ar/ProductGlassesCarousel";
import ARControls, { ARAdjustments, defaultAdjustments } from "@/components/ar/ARControls";
import FrameShapePanel, { FrameShape } from "@/components/ar/FrameShapePanel";
import LensColorSelector, { LensColor } from "@/components/ar/LensColorSelector";
import { glassesStyles } from "@/data/glassesStyles";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/utils/formatCurrency";
import type { Tables } from "@/integrations/supabase/types";

interface ARTryOnProps {
  product?: Tables<"glasses_products">;
  onClose: () => void;
  useRealProducts?: boolean;
}

type SourceMode = "camera" | "photo";
type RenderMode = "3d" | "2d";

const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 720;

function computeCoverDrawRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
) {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;

  let drawW = dstW;
  let drawH = dstH;
  if (srcAspect > dstAspect) {
    drawH = dstH;
    drawW = srcAspect * drawH;
  } else {
    drawW = dstW;
    drawH = drawW / srcAspect;
  }
  const offsetX = (dstW - drawW) / 2;
  const offsetY = (dstH - drawH) / 2;
  return { drawW, drawH, offsetX, offsetY };
}

const ARTryOn = ({ product, onClose, useRealProducts = true }: ARTryOnProps) => {
  const [mode, setMode] = useState<SourceMode>("camera");
  const [renderMode, setRenderMode] = useState<RenderMode>("3d");
  const [selectedFrameShape, setSelectedFrameShape] = useState<FrameShape>(
    (product?.frame_style as FrameShape) || "aviator"
  );
  const [selectedProduct, setSelectedProduct] = useState<Tables<"glasses_products"> | null>(product || null);
  const [selectedGlassesId, setSelectedGlassesId] = useState(
    product?.frame_style ? `${product.frame_style}-${product.frame_color?.toLowerCase()}` : glassesStyles[0].id
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [arAdjustments, setArAdjustments] = useState<ARAdjustments>(defaultAdjustments);
  const [showARControls, setShowARControls] = useState(false);
  const [selectedLensColor, setSelectedLensColor] = useState<LensColor>("clear");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { landmarks, isLoading, error, fps } = useFaceTracking({
    videoRef,
    canvasRef,
    isActive: mode === "camera" && !capturedImage,
  });

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = TARGET_WIDTH;
      canvasRef.current.height = TARGET_HEIGHT;
    }
  }, []);

  useEffect(() => {
    let rafId = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const draw = () => {
      if (!canvas || !ctx) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mode === "camera" && videoRef.current && !capturedImage) {
        const v = videoRef.current;
        const vw = v.videoWidth || TARGET_WIDTH;
        const vh = v.videoHeight || TARGET_HEIGHT;

        const { drawW, drawH, offsetX, offsetY } = computeCoverDrawRect(vw, vh, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(v, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      } else if (mode === "photo" && uploadedImage && !capturedImage) {
        const img = uploadedImage;
        const { drawW, drawH, offsetX, offsetY } = computeCoverDrawRect(img.width, img.height, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [mode, uploadedImage, capturedImage]);

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.toDataURL("image/png");
    setCapturedImage(imageData);
    toast.success("Photo captured!");
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setUploadedImage(null);
    setMode("camera");
  }, []);

  const downloadPhoto = useCallback(() => {
    if (!capturedImage && !canvasRef.current) return;
    const imageData = capturedImage || canvasRef.current?.toDataURL("image/png");
    if (!imageData) return;

    const link = document.createElement("a");
    link.href = imageData;
    link.download = `fitframe-tryon-${Date.now()}.png`;
    link.click();
    toast.success("Photo downloaded!");
  }, [capturedImage]);

  const sharePhoto = async () => {
    const imageData = capturedImage || canvasRef.current?.toDataURL("image/png");
    if (!imageData) return;

    try {
      const blob = await (await fetch(imageData)).blob();
      const file = new File([blob], `fitframe-tryon.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "FitFrame Virtual Try-On",
          text: "Check out my virtual try-on!",
        });
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast.error("Unable to share. Try downloading instead.");
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
      setMode("photo");
    };
    img.src = URL.createObjectURL(file);
    toast.success("Photo uploaded! Face tracking will analyze the image.");
  }, []);

  const switchToCamera = useCallback(() => {
    setUploadedImage(null);
    setCapturedImage(null);
    setMode("camera");
  }, []);

  const addToCart = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to add to cart");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", selectedProduct.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: selectedProduct.id, quantity: 1 });
      }
      
      toast.success(`${selectedProduct.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const handleProductSelect = (p: Tables<"glasses_products">) => {
    setSelectedProduct(p);
    setSelectedGlassesId(`${p.frame_style}-${p.frame_color.toLowerCase()}`);
  };

  const canvasWidth = canvasRef.current?.width || TARGET_WIDTH;
  const canvasHeight = canvasRef.current?.height || TARGET_HEIGHT;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary/95 to-primary z-50 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-primary to-transparent">
        <div className="text-primary-foreground">
          <h2 className="text-xl font-bold">Virtual Try-On</h2>
          <p className="text-sm text-primary-foreground/70">
            {selectedProduct ? selectedProduct.name : (mode === "camera" ? "Move your head to see different angles" : "Photo mode")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-primary-foreground/10 rounded-xl p-1">
            <button
              onClick={() => setRenderMode("3d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                renderMode === "3d" 
                  ? "bg-accent text-accent-foreground shadow-gold" 
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              <Box className="h-3 w-3 inline mr-1" />
              3D
            </button>
            <button
              onClick={() => setRenderMode("2d")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                renderMode === "2d" 
                  ? "bg-accent text-accent-foreground shadow-gold" 
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              }`}
            >
              <Layers className="h-3 w-3 inline mr-1" />
              2D
            </button>
          </div>
          {mode === "camera" && !capturedImage && (
            <div className="text-xs text-primary-foreground/60 bg-primary-foreground/10 px-2 py-1 rounded-lg">
              {fps} FPS
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20 rounded-xl"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-2 space-y-3">
        <FrameShapePanel selectedShape={selectedFrameShape} onSelect={setSelectedFrameShape} />
        <LensColorSelector selectedColor={selectedLensColor} onSelect={setSelectedLensColor} />
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isLoading && mode === "camera" && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/50 z-20">
            <div className="text-center text-primary-foreground">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3 text-accent" />
              <p className="text-lg font-medium">Loading face tracking...</p>
              <p className="text-sm text-primary-foreground/60">This may take a moment</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/50 z-20">
            <div className="text-center text-primary-foreground p-6 bg-destructive/20 rounded-2xl max-w-md border border-destructive/30">
              <Camera className="h-12 w-12 mx-auto mb-3 text-destructive" />
              <p className="text-lg font-bold mb-2">Camera Error</p>
              <p className="text-sm text-primary-foreground/80">{error}</p>
              <Button variant="secondary" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo Instead
              </Button>
            </div>
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted className="hidden" />

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={TARGET_WIDTH}
            height={TARGET_HEIGHT}
            className="max-w-full max-h-[50vh] rounded-2xl shadow-elevated"
          />

          {renderMode === "3d" && landmarks ? (
            <Glasses3DOverlay
              faceLandmarks={landmarks}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              selectedProduct={selectedProduct}
              frameStyle={selectedFrameShape}
              adjustments={arAdjustments}
              lensColor={selectedLensColor}
            />
          ) : (
            <RealisticGlassesOverlay
              landmarks={landmarks}
              canvasRef={canvasRef}
              videoRef={videoRef}
              selectedProduct={selectedProduct}
              imageSource={uploadedImage}
            />
          )}
        </div>

        {renderMode === "3d" && landmarks && !capturedImage && (
          <ARControls
            adjustments={arAdjustments}
            onChange={setArAdjustments}
            isVisible={showARControls}
            onToggle={() => setShowARControls(!showARControls)}
          />
        )}

        {mode === "camera" && !isLoading && !error && (
          <div
            className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium ${
              landmarks ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {landmarks ? "✓ Face detected" : "○ Looking for face..."}
          </div>
        )}

        {selectedProduct && (
          <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-gold">
            {formatNaira(selectedProduct.price)}
          </div>
        )}

        {capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/95">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-[60vh] rounded-2xl shadow-elevated"
            />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-t from-primary to-primary/80 pt-4 pb-2">
        {useRealProducts ? (
          <ProductGlassesCarousel
            selectedProductId={selectedProduct?.id || ""}
            onSelect={handleProductSelect}
            initialProduct={product}
          />
        ) : (
          <GlassesCarousel selectedId={selectedGlassesId} onSelect={setSelectedGlassesId} />
        )}
      </div>

      <div className="bg-primary p-4 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!capturedImage ? (
            <>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-2 rounded-xl">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              {mode === "camera" && (
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  variant="premium"
                  className="rounded-full h-16 w-16 shadow-gold"
                  disabled={!landmarks}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              )}
              {mode === "photo" && uploadedImage && (
                <Button variant="secondary" onClick={switchToCamera} className="gap-2 rounded-xl">
                  <Camera className="h-4 w-4" />
                  Use Camera
                </Button>
              )}
              {selectedProduct && (
                <Button onClick={addToCart} variant="premium" className="gap-2 rounded-xl">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={downloadPhoto}
                className="gap-2 rounded-xl"
                disabled={!landmarks && mode === "camera"}
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button onClick={retakePhoto} variant="secondary" className="gap-2 rounded-xl">
                <RotateCw className="h-4 w-4" />
                Retake
              </Button>
              <Button onClick={downloadPhoto} variant="secondary" className="gap-2 rounded-xl">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={sharePhoto} variant="premium" className="gap-2 rounded-xl">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {selectedProduct && (
                <Button onClick={addToCart} variant="secondary" className="gap-2 rounded-xl">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              )}
            </>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </div>
    </div>
  );
};

export default ARTryOn;
