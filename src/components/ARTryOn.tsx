import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCw, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ARTryOnProps {
  product: any;
  onClose: () => void;
}

const ARTryOn = ({ product, onClose }: ARTryOnProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          setIsLoading(false);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera. Please check permissions.");
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setCapturedImage(imageData);
        toast.success("Photo captured!");
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const downloadPhoto = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = `fitframe-${product.name}-tryon.png`;
      link.click();
      toast.success("Photo downloaded!");
    }
  };

  const sharePhoto = async () => {
    if (capturedImage) {
      try {
        const blob = await (await fetch(capturedImage)).blob();
        const file = new File([blob], `fitframe-${product.name}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "FitFrame Virtual Try-On",
            text: `Check out how I look in ${product.brand} ${product.name}!`,
          });
          toast.success("Shared successfully!");
        } else {
          // Fallback: copy image to clipboard
          toast.info("Sharing not available. Photo ready to download!");
        }
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Unable to share. Try downloading instead.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-card rounded-lg overflow-hidden shadow-elegant">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-xl font-semibold">{product.brand}</h2>
              <p className="text-sm text-white/80">{product.name}</p>
            </div>
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

        {/* Camera View */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-16 w-16 animate-pulse mx-auto mb-4" />
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {cameraActive && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Frame Overlay Simulation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative" style={{ width: "60%", maxWidth: "400px" }}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="opacity-60 mix-blend-multiply"
                    style={{
                      filter: "brightness(1.2) contrast(1.1)",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            {!capturedImage ? (
              <>
                <Button
                  onClick={capturePhoto}
                  size="lg"
                  className="rounded-full h-16 w-16 bg-primary hover:bg-primary-hover shadow-elegant"
                  disabled={!cameraActive}
                >
                  <Camera className="h-6 w-6" />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARTryOn;
