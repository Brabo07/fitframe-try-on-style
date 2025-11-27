import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCw, Download, Share2, Upload, Loader2, ShoppingCart, Box, Layers } from "lucide-react";
import { toast } from "sonner";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import RealisticGlassesOverlay from "@/components/ar/RealisticGlassesOverlay";
import Glasses3DOverlay from "@/components/ar/Glasses3DOverlay";
import GlassesCarousel from "@/components/ar/GlassesCarousel";
import ProductGlassesCarousel from "@/components/ar/ProductGlassesCarousel";
import { glassesStyles } from "@/data/glassesStyles";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/utils/formatCurrency";
import type { Tables } from "@/integrations/supabase/types";

interface ARTryOnProps {
  product?: Tables<"glasses_products">;
  onClose: () => void;
  useRealProducts?: boolean;
}

const ARTryOn = ({ product, onClose, useRealProducts = true }: ARTryOnProps) => {
  const [mode, setMode] = useState<"camera" | "photo">("camera");
  const [renderMode, setRenderMode] = useState<"3d" | "2d">("3d");
  const [selectedProduct, setSelectedProduct] = useState<Tables<"glasses_products"> | null>(
    product || null
  );
  const [selectedGlassesId, setSelectedGlassesId] = useState(
    product?.frame_style ? `${product.frame_style}-${product.frame_color?.toLowerCase()}` : glassesStyles[0].id
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { landmarks, isLoading, error, fps } = useFaceTracking({
    videoRef,
    canvasRef,
    isActive: mode === "camera" && !capturedImage,
  });

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.toDataURL("image/png");
    setCapturedImage(imageData);
    toast.success("Photo captured!");
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setUploadedImage(null);
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
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
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
      
      if (canvasRef.current) {
        const maxWidth = 1280;
        const maxHeight = 720;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    img.src = URL.createObjectURL(file);
    toast.success("Photo uploaded! Face tracking will analyze the image.");
  }, []);

  const switchToCamera = useCallback(() => {
    setUploadedImage(null);
    setCapturedImage(null);
    setMode("camera");
    
    if (canvasRef.current) {
      canvasRef.current.width = 1280;
      canvasRef.current.height = 720;
    }
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

  const handleProductSelect = (product: Tables<"glasses_products">) => {
    setSelectedProduct(product);
    setSelectedGlassesId(`${product.frame_style}-${product.frame_color.toLowerCase()}`);
  };

  const canvasWidth = canvasRef.current?.width || 1280;
  const canvasHeight = canvasRef.current?.height || 720;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
          <h2 className="text-xl font-semibold">Virtual Try-On</h2>
          <p className="text-sm text-white/70">
            {selectedProduct ? selectedProduct.name : (mode === "camera" ? "Move your head to see different angles" : "Photo mode")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Render mode toggle */}
          <div className="flex items-center bg-white/10 rounded-full p-1">
            <button
              onClick={() => setRenderMode("3d")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                renderMode === "3d" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Box className="h-3 w-3 inline mr-1" />
              3D
            </button>
            <button
              onClick={() => setRenderMode("2d")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                renderMode === "2d" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Layers className="h-3 w-3 inline mr-1" />
              2D
            </button>
          </div>
          
          {mode === "camera" && !capturedImage && (
            <div className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
              {fps} FPS
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isLoading && mode === "camera" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3" />
              <p className="text-lg">Loading face tracking...</p>
              <p className="text-sm text-white/60">This may take a moment</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center text-white p-6 bg-destructive/20 rounded-lg max-w-md">
              <Camera className="h-12 w-12 mx-auto mb-3 text-destructive" />
              <p className="text-lg font-medium mb-2">Camera Error</p>
              <p className="text-sm text-white/80">{error}</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo Instead
              </Button>
            </div>
          </div>
        )}

        {/* Video element (hidden, used for MediaPipe) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* Canvas container with relative positioning for 3D overlay */}
        <div className="relative">
          {/* Canvas for video/photo rendering */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
          />

          {/* 3D or 2D Glasses Overlay */}
          {renderMode === "3d" && landmarks ? (
            <Glasses3DOverlay
              faceLandmarks={landmarks}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              selectedProduct={selectedProduct}
              frameStyle={selectedProduct?.frame_style || "wayfarer"}
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

        {/* Face detection indicator */}
        {mode === "camera" && !isLoading && !error && (
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium ${
            landmarks ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
          }`}>
            {landmarks ? "✓ Face detected" : "○ Looking for face..."}
          </div>
        )}

        {/* Selected product price tag */}
        {selectedProduct && (
          <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-bold">
            {formatNaira(selectedProduct.price)}
          </div>
        )}

        {/* Captured image overlay */}
        {capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-[60vh] rounded-lg shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Glasses Carousel */}
      <div className="bg-gradient-to-t from-black/90 to-black/60 pt-4 pb-2">
        {useRealProducts ? (
          <ProductGlassesCarousel
            selectedProductId={selectedProduct?.id || ""}
            onSelect={handleProductSelect}
            initialProduct={product}
          />
        ) : (
          <GlassesCarousel
            selectedId={selectedGlassesId}
            onSelect={setSelectedGlassesId}
          />
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/90 p-4 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!capturedImage ? (
            <>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              
              {mode === "camera" && (
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full h-16 w-16 bg-primary hover:bg-primary/80 shadow-lg"
                  disabled={!landmarks}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              )}

              {mode === "photo" && uploadedImage && (
                <Button
                  variant="secondary"
                  onClick={switchToCamera}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Use Camera
                </Button>
              )}

              {selectedProduct && (
                <Button
                  onClick={addToCart}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={downloadPhoto}
                className="gap-2"
                disabled={!landmarks && mode === "camera"}
              >
                <Download className="h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={retakePhoto}
                variant="secondary"
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={downloadPhoto}
                variant="secondary"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={sharePhoto}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              {selectedProduct && (
                <Button
                  onClick={addToCart}
                  variant="secondary"
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              )}
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ARTryOn;
