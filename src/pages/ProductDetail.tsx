import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import PrescriptionForm from "@/components/PrescriptionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, Camera, Loader2, ArrowLeft, Share2, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import ARTryOn from "@/components/ARTryOn";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatNaira } from "@/utils/formatCurrency";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showARTryOn, setShowARTryOn] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const { data, error } = await supabase
          .from("glasses_products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProduct(data);

        if (user) {
          const { data: favData } = await supabase
            .from("user_favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", id)
            .single();
          setIsFavorite(!!favData);

          // Fetch user's prescription data
          const { data: profileData } = await supabase
            .from("profiles")
            .select("prescription_sph_left, prescription_sph_right, prescription_cyl_left, prescription_cyl_right, prescription_axis_left, prescription_axis_right, prescription_add, prescription_pd, prescription_image_url")
            .eq("user_id", user.id)
            .single();

          if (profileData) {
            setPrescriptionData({
              sphLeft: profileData.prescription_sph_left,
              sphRight: profileData.prescription_sph_right,
              cylLeft: profileData.prescription_cyl_left,
              cylRight: profileData.prescription_cyl_right,
              axisLeft: profileData.prescription_axis_left,
              axisRight: profileData.prescription_axis_right,
              add: profileData.prescription_add,
              pd: profileData.prescription_pd,
              imageUrl: profileData.prescription_image_url
            });
          }
        }

        // Track product view
        if (user && data) {
          trackEvent("product_view", {
            product_id: data.id,
            product_name: data.name,
            product_brand: data.brand,
          });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const toggleFavorite = async () => {
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
          .eq("product_id", id);
        setIsFavorite(false);
        toast.success("Removed from favorites");
        trackEvent("favorite_removed", { product_id: id, product_name: product?.name });
      } else {
        await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, product_id: id });
        setIsFavorite(true);
        toast.success("Added to favorites");
        trackEvent("favorite_added", { product_id: id, product_name: product?.name });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add to cart");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: id, quantity: 1 });
      }
      
      toast.success("Added to cart");
      trackEvent("add_to_cart", { product_id: id, product_name: product?.name, product_price: product?.price });
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  const shareProduct = async () => {
    const shareData = {
      title: `${product.brand} ${product.name}`,
      text: `Check out these ${product.name} glasses from ${product.brand} on FitFrame!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 px-4">
          <p className="text-center text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/browse")}
          className="mb-6 hover-lift"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4 animate-fade-in-up">
            <Card className="overflow-hidden card-premium">
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop"}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            </Card>
            <Button 
              variant="outline" 
              className="w-full hover-lift" 
              size="lg"
              onClick={() => {
                setShowARTryOn(true);
                trackEvent("ar_tryon_opened", { product_id: id, product_name: product?.name });
              }}
            >
              <Camera className="mr-2 h-5 w-5" />
              Virtual Try-On
            </Button>
          </div>

          <div className="space-y-6 animate-fade-in-up stagger-1">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-xl text-muted-foreground">{product.brand}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {product.frame_style.split("_").map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(" ")}
              </Badge>
              <Badge variant="outline" className="text-base px-3 py-1">
                {product.frame_color}
              </Badge>
            </div>

            <p className="text-3xl font-bold text-primary">{formatNaira(product.price)}</p>

            {product.description && (
              <Card className="card-premium">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            )}

            <Card className="card-premium">
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Material</p>
                    <p className="font-medium capitalize">{product.frame_material}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{product.gender}</p>
                  </div>
                  {product.lens_width && (
                    <div>
                      <p className="text-muted-foreground">Lens Width</p>
                      <p className="font-medium">{product.lens_width}mm</p>
                    </div>
                  )}
                  {product.bridge_width && (
                    <div>
                      <p className="text-muted-foreground">Bridge Width</p>
                      <p className="font-medium">{product.bridge_width}mm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescription Form Collapsible */}
            <Collapsible open={prescriptionOpen} onOpenChange={setPrescriptionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between hover-lift">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Add Prescription Details
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${prescriptionOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <PrescriptionForm 
                  initialData={prescriptionData}
                  onSave={() => {
                    toast.success("Prescription saved!");
                    setPrescriptionOpen(false);
                  }}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1 hover-lift"
                onClick={addToCart}
              >
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={toggleFavorite}
                className="hover-lift"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={shareProduct}
                className="hover-lift"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {showARTryOn && (
        <ARTryOn product={product} onClose={() => setShowARTryOn(false)} />
      )}
    </div>
  );
};

export default ProductDetail;
