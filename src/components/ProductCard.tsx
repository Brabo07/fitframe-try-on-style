import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    frame_color: string;
    image_url: string | null;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-hover transition-all duration-300 group border-border/50">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background hover:scale-110 transition-all duration-300"
            onClick={toggleFavorite}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${isFavorite ? "fill-primary text-primary" : ""}`}
            />
          </Button>
        </div>
        <CardContent className="p-5 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{product.brand}</span>
            <span>{product.frame_color}</span>
          </div>
          <p className="text-xl font-bold">${product.price}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
