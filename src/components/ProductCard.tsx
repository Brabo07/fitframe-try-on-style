import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Camera, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import ARTryOn from "@/components/ARTryOn";
import { formatNaira } from "@/utils/formatCurrency";
import type { Tables } from "@/integrations/supabase/types";

interface ProductCardProps {
  product: Tables<"glasses_products">;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showARTryOn, setShowARTryOn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
          className={`
            overflow-hidden border-border/30 rounded-2xl bg-card
            transition-all duration-500 ease-out
            ${isHovered 
              ? 'shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.25)] -translate-y-2 scale-[1.02]' 
              : 'shadow-card hover:shadow-hover'
            }
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60">
            {/* Product image with subtle motion effects */}
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop"}
              alt={product.name}
              className={`
                w-full h-full object-cover
                transition-all duration-700 ease-out
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop";
              }}
            />
            
            {/* Subtle glow overlay on hover */}
            <div 
              className={`
                absolute inset-0 pointer-events-none
                bg-gradient-to-t from-primary/10 via-transparent to-accent/5
                transition-opacity duration-500
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}
            />

            {/* Elegant shine effect on hover */}
            <div 
              className={`
                absolute inset-0 pointer-events-none
                bg-gradient-to-br from-white/20 via-transparent to-transparent
                transition-all duration-700 ease-out
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}
              `}
            />

            {/* Action buttons with smooth entrance */}
            <div 
              className={`
                absolute top-3 right-3 flex gap-2
                transition-all duration-300 ease-out
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
              `}
            >
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/95 backdrop-blur-md hover:bg-accent hover:text-accent-foreground rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
                onClick={handleTryOn}
              >
                <Camera className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/95 backdrop-blur-md hover:bg-accent hover:text-accent-foreground rounded-xl shadow-lg transition-all duration-300 hover:scale-110"
                onClick={toggleFavorite}
              >
                <Heart
                  className={`h-5 w-5 transition-all duration-300 ${isFavorite ? "fill-accent text-accent scale-110" : ""}`}
                />
              </Button>
            </div>

            {/* Frame style badge */}
            <div 
              className={`
                absolute bottom-3 left-3
                bg-primary/90 text-primary-foreground backdrop-blur-md
                px-3 py-1.5 rounded-xl text-xs font-semibold
                transition-all duration-500 ease-out
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}
            >
              {product.frame_style?.replace('_', ' ')}
            </div>
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div className={`transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
              <h3 className="font-bold text-base line-clamp-1 text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-bold text-accent transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}>
                {formatNaira(product.price)}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className={`rounded-lg transition-all duration-300 ${isHovered ? 'shadow-md' : ''}`}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`
                w-full rounded-xl border-primary/30 text-primary 
                hover:bg-primary hover:text-primary-foreground
                transition-all duration-300
                ${isHovered ? 'bg-primary/5 border-primary/50' : ''}
              `}
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