import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Sparkles, ArrowRight, Loader2, Video, CircleDot, Check } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatNaira } from "@/utils/formatCurrency";
import { Database } from "@/integrations/supabase/types";

type FrameStyle = Database["public"]["Enums"]["frame_style"];

const faceShapeInfo: Record<string, { description: string; recommendedStyles: FrameStyle[] }> = {
  oval: {
    description: "Balanced proportions with a gently rounded forehead and chin. Most frame shapes complement this versatile face shape.",
    recommendedStyles: ["aviator", "wayfarer", "cat_eye", "round", "rectangular"]
  },
  round: {
    description: "Full cheeks with similar width and length. Angular and geometric frames add definition and elongate the face.",
    recommendedStyles: ["rectangular", "geometric", "wayfarer", "cat_eye"]
  },
  square: {
    description: "Strong jawline with equal width across forehead, cheekbones, and jaw. Round and aviator frames soften angular features.",
    recommendedStyles: ["round", "aviator", "cat_eye", "oversized"]
  },
  heart: {
    description: "Wider forehead tapering to a narrow chin. Bottom-heavy frames balance the face beautifully.",
    recommendedStyles: ["aviator", "round", "cat_eye", "wayfarer"]
  },
  diamond: {
    description: "Narrow forehead and jawline with wide cheekbones. Cat-eye and geometric frames highlight cheekbones gracefully.",
    recommendedStyles: ["cat_eye", "geometric", "aviator", "rectangular"]
  },
  oblong: {
    description: "Face is longer than it is wide. Oversized and round frames add width and break up the length.",
    recommendedStyles: ["oversized", "round", "wayfarer", "aviator"]
  }
};

const FaceShapeAnalysis = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [faceShape, setFaceShape] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Tables<"glasses_products">[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [step, setStep] = useState<'intro' | 'camera' | 'analyzing' | 'results'>('intro');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    document.title = "Face Shape Assistant - FitFrame";
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraActive(true);
      setStep('camera');
      setFaceShape(null);
      setCapturedImage(null);
      setRecommendedProducts([]);
      
    } catch (error: any) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to analyze your face shape.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Start countdown
    setCountdown(3);
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(null);
    setStep('analyzing');
    setAnalyzing(true);

    // Capture frame
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      stopCamera();

      try {
        const response = await supabase.functions.invoke('analyze-face-shape', {
          body: { image: imageData }
        });

        // Check for HTTP error responses
        if (response.error) {
          console.error("Function invocation error:", response.error);
          throw new Error(response.error.message || "Failed to analyze face shape");
        }

        // Check if we got error data back from the function
        if (response.data?.error) {
          console.error("Edge function returned error:", response.data.error);
          throw new Error(response.data.error);
        }

        // Validate the response has the expected structure
        if (!response.data || !response.data.faceShape) {
          console.error("Invalid response structure:", response.data);
          throw new Error("Received invalid response from analysis service");
        }

        const detectedShape = response.data.faceShape;
        console.log("Face shape detected:", detectedShape);
        
        setFaceShape(detectedShape);
        setStep('results');

        // Fetch recommended products based on face shape
        const recommendedStyles = faceShapeInfo[detectedShape]?.recommendedStyles || [];
        const { data: products, error: productsError } = await supabase
          .from('glasses_products')
          .select('*')
          .eq('in_stock', true)
          .in('frame_style', recommendedStyles)
          .limit(6);

        if (productsError) {
          console.error("Error fetching products:", productsError);
        }

        setRecommendedProducts(products || []);

        toast({
          title: "Analysis Complete!",
          description: `Your face shape appears to be ${detectedShape}.`
        });
      } catch (error: any) {
        console.error("Analysis error:", error);
        setStep('intro');
        
        let errorMessage = "Please try again with better lighting.";
        
        // Handle specific error messages
        if (error.message?.includes("Rate limit")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.message?.includes("Payment required")) {
          errorMessage = "Service temporarily unavailable. Please try again later.";
        } else if (error.message?.includes("Camera") || error.message?.includes("camera")) {
          errorMessage = "Camera access error. Please check your permissions.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setAnalyzing(false);
      }
    }
  }, []);

  const resetAnalysis = () => {
    setStep('intro');
    setFaceShape(null);
    setCapturedImage(null);
    setRecommendedProducts([]);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Face Shape Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            {step === 'intro' && "Let our AI analyze your face shape and recommend the perfect frames."}
            {step === 'camera' && "Position your face in the center and hold still."}
            {step === 'analyzing' && "Analyzing your facial features..."}
            {step === 'results' && "Here are your personalized recommendations!"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Camera Section */}
          <Card className="card-premium animate-fade-in overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === 'camera' && <CircleDot className="h-5 w-5 text-red-500 animate-pulse" />}
                {step === 'results' && <Check className="h-5 w-5 text-green-500" />}
                {step === 'intro' ? 'Start Analysis' : step === 'camera' ? 'Live Camera' : step === 'analyzing' ? 'Processing...' : 'Captured Photo'}
              </CardTitle>
              <CardDescription>
                {step === 'intro' && "Click below to open your camera and analyze your face shape instantly."}
                {step === 'camera' && "Look directly at the camera with good lighting. We'll capture automatically."}
                {step === 'analyzing' && "Please wait while we analyze your facial features."}
                {step === 'results' && "Analysis complete! See your results on the right."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                {/* Video element for live camera */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Canvas for capturing (hidden) */}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Captured image display */}
                {capturedImage && !cameraActive && (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Intro state */}
                {step === 'intro' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className="p-6 rounded-full bg-primary/10 animate-pulse">
                      <Camera className="h-12 w-12 text-primary" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-semibold text-lg">Ready to Begin</p>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Click the button below to open your camera and start the face shape analysis.
                      </p>
                    </div>
                  </div>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                    <div className="text-8xl font-bold text-white animate-pulse drop-shadow-lg">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Analyzing overlay */}
                {step === 'analyzing' && !countdown && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/20 backdrop-blur-sm gap-4">
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                    <p className="text-white font-semibold text-lg">Analyzing your face shape...</p>
                  </div>
                )}

                {/* Face guide overlay for camera */}
                {cameraActive && countdown === null && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 md:inset-16 border-4 border-dashed border-white/50 rounded-full" />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block text-sm font-medium">
                        Position your face inside the circle
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {step === 'intro' && (
                  <Button 
                    onClick={startCamera}
                    className="w-full hover-lift"
                    size="lg"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Open Camera
                  </Button>
                )}

                {step === 'camera' && (
                  <>
                    <Button 
                      onClick={captureAndAnalyze}
                      disabled={analyzing}
                      className="flex-1 hover-lift"
                      size="lg"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capture & Analyze
                    </Button>
                    <Button 
                      onClick={stopCamera}
                      variant="outline"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {step === 'results' && (
                  <Button 
                    onClick={resetAnalysis}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>

              {/* Onboarding tips */}
              {(step === 'intro' || step === 'camera') && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { icon: "💡", text: "Good lighting" },
                    { icon: "👤", text: "Face the camera" },
                    { icon: "🎯", text: "Stay centered" }
                  ].map((tip, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-muted/50">
                      <span className="text-2xl mb-1 block">{tip.icon}</span>
                      <span className="text-xs text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6 animate-fade-in">
            {faceShape ? (
              <>
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      Your Face Shape: <span className="text-accent capitalize">{faceShape}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faceShapeInfo[faceShape]?.description}
                    </p>
                  </CardContent>
                </Card>

                {recommendedProducts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Recommended Frames</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {recommendedProducts.slice(0, 4).map((product) => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.id}`}
                          className="group"
                        >
                          <Card className="overflow-hidden hover-lift">
                            <div className="aspect-square bg-muted relative">
                              {product.image_url && (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <CardContent className="p-3">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-accent font-semibold">{formatNaira(product.price)}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/browse">
                        View All Recommendations
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="card-premium h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center p-8">
                  <div className="p-4 rounded-full bg-muted inline-block mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground mb-6">
                    Open your camera to discover your face shape and get personalized frame recommendations.
                  </p>
                  <div className="space-y-3 text-left max-w-xs mx-auto">
                    {[
                      "AI analyzes your facial features",
                      "Identifies your unique face shape",
                      "Recommends perfect frame styles"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                          {i + 1}
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceShapeAnalysis;