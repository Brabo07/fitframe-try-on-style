import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, ChevronDown, ChevronUp, Glasses } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatNaira } from "@/utils/formatCurrency";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [isOpen, setIsOpen] = useState(true);

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

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between px-4 py-2 bg-primary-foreground/5 rounded-xl mx-2 hover:bg-primary-foreground/10 transition-colors">
          <div className="flex items-center gap-2">
            <Glasses className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-primary-foreground">
              {selectedProduct ? selectedProduct.name : "More Frames"}
            </span>
            {selectedProduct && (
              <span className="text-xs text-accent font-medium">
                {formatNaira(selectedProduct.price)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary-foreground/60">
              {products.length} available
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-primary-foreground/60" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary-foreground/60" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="w-full overflow-x-auto pb-2 pt-3">
          <div className="flex gap-3 px-2 min-w-max">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl transition-all duration-200",
                  "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50",
                  selectedProductId === product.id
                    ? "bg-accent/20 ring-2 ring-accent shadow-gold"
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
                <span className="text-[10px] text-accent font-medium">{formatNaira(product.price)}</span>
              </button>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ProductGlassesCarousel;
