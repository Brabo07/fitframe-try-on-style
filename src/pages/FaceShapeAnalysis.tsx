import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Upload, Sparkles, ArrowRight, Loader2 } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [faceShape, setFaceShape] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Tables<"glasses_products">[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Face Shape Assistant - FitFrame";
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setFaceShape(null);
        setRecommendedProducts([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-face-shape', {
        body: { image: selectedImage }
      });

      if (error) throw error;

      const detectedShape = data.faceShape;
      setFaceShape(detectedShape);

      // Fetch recommended products based on face shape
      const recommendedStyles = faceShapeInfo[detectedShape]?.recommendedStyles || [];
      const { data: products } = await supabase
        .from('glasses_products')
        .select('*')
        .eq('in_stock', true)
        .in('frame_style', recommendedStyles)
        .limit(6);

      setRecommendedProducts(products || []);

      toast({
        title: "Analysis Complete!",
        description: `Your face shape appears to be ${detectedShape}.`
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Please try again with a clearer photo.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Face Shape Assistant
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a photo and our AI will analyze your face shape to recommend the perfect frames for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <Card className="card-premium animate-fade-in-up stagger-1">
            <CardHeader>
              <CardTitle>Upload Your Photo</CardTitle>
              <CardDescription>
                For best results, use a front-facing photo with good lighting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                  selectedImage 
                    ? "border-primary bg-muted" 
                    : "border-border hover:border-primary hover:bg-muted/50"
                }`}
              >
                {selectedImage ? (
                  <img 
                    src={selectedImage} 
                    alt="Your photo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm text-muted-foreground">or drag and drop</p>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <Button 
                onClick={analyzeImage}
                disabled={!selectedImage || analyzing}
                className="w-full hover-lift"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Analyze My Face Shape
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6 animate-fade-in-up stagger-2">
            {faceShape ? (
              <>
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Your Face Shape: <span className="text-primary capitalize">{faceShape}</span>
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
                              <p className="text-primary font-semibold">{formatNaira(product.price)}</p>
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
                <CardContent className="text-center">
                  <div className="p-4 rounded-full bg-muted inline-block mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground">
                    Upload a photo to discover your face shape and get personalized frame recommendations.
                  </p>
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
