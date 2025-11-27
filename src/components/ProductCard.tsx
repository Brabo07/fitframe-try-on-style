import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Camera, ShoppingCart, Play } from "lucide-react";
import { toast } from "sonner";
import ARTryOn from "@/components/ARTryOn";
import { formatNaira } from "@/utils/formatCurrency";
import type { Tables } from "@/integrations/supabase/types";

interface ProductCardProps {
  product: Tables<"glasses_products">;
}

// Placeholder videos for product motion previews
const productVideos: Record<string, string> = {
  default: "https://videos.pexels.com/video-files/5699838/5699838-sd_360_640_25fps.mp4"
};

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showARTryOn, setShowARTryOn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data } = await supabase
          .from("user_favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .single();
        
        setIsFavorite(!!data);
      }
    };
    checkFavorite();
  }, [product.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, product_id: product.id });
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const handleTryOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowARTryOn(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to add to cart");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      }
      
      toast.success("Added to cart");
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  return (
    <>
      <Link to={`/product/${product.id}`}>
        <Card 
          className="overflow-hidden transition-all duration-300 group border-accent/10 rounded-2xl shadow-card hover:shadow-hover hover:-translate-y-1"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden bg-muted/50">
            {/* Video preview on hover */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              src={productVideos.default}
              muted
              loop
              playsInline
            />
            
            {/* Static image */}
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop"}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isHovered ? "opacity-0 scale-110" : "opacity-100"
              }`}
            />

            {/* Play indicator */}
            <div className={`absolute bottom-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}>
              <Play className="h-3 w-3 fill-current" />
              Preview
            </div>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/95 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-300"
                onClick={handleTryOn}
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/95 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-300"
                onClick={toggleFavorite}
              >
                <Heart
                  className={`h-5 w-5 transition-all duration-300 ${isFavorite ? "fill-accent text-accent" : ""}`}
                />
              </Button>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-base line-clamp-1 text-primary">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-accent">{formatNaira(product.price)}</p>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleTryOn}
            >
              <Camera className="h-4 w-4 mr-2" />
              Try On
            </Button>
          </CardContent>
        </Card>
      </Link>

      {showARTryOn && (
        <ARTryOn
          product={product}
          onClose={() => setShowARTryOn(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
