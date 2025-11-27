import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatNaira } from "@/utils/formatCurrency";

interface ProductGlassesCarouselProps {
  selectedProductId: string;
  onSelect: (product: Tables<"glasses_products">) => void;
  initialProduct?: Tables<"glasses_products">;
}

const ProductGlassesCarousel = ({ 
  selectedProductId, 
  onSelect,
  initialProduct 
}: ProductGlassesCarouselProps) => {
  const [products, setProducts] = useState<Tables<"glasses_products">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("glasses_products")
          .select("*")
          .eq("in_stock", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // If we have an initial product that's not in the fetched list, add it
        if (initialProduct && data && !data.find(p => p.id === initialProduct.id)) {
          setProducts([initialProduct, ...data]);
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-3 px-2 min-w-max">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl transition-all duration-200",
              "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50",
              selectedProductId === product.id
                ? "bg-primary/20 ring-2 ring-primary shadow-lg"
                : "bg-white/5"
            )}
          >
            <div className="w-20 h-12 rounded-lg overflow-hidden mb-1 bg-white/10">
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=200&fit=crop"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-medium text-white truncate max-w-[80px]">
              {product.name}
            </span>
            <span className="text-[10px] text-white/60">{product.frame_color}</span>
            <span className="text-[10px] text-primary font-medium">{formatNaira(product.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductGlassesCarousel;
