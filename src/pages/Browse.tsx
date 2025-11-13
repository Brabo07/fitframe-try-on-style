import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

const Browse = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await Promise.all([fetchProducts(), fetchRecommendations(session.user.id)]);
    };
    checkAuth();
  }, [navigate, styleFilter, genderFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("glasses_products").select("*").eq("in_stock", true);

      if (styleFilter !== "all") {
        query = query.eq("frame_style", styleFilter as any);
      }
      if (genderFilter !== "all") {
        query = query.eq("gender", genderFilter as any);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (userId: string) => {
    try {
      // Fetch user's profile to get preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("face_shape, preferred_styles, gender")
        .eq("user_id", userId)
        .single();

      let query = supabase.from("glasses_products").select("*").eq("in_stock", true);

      // Filter by user's preferences
      if (profile?.face_shape) {
        query = query.contains("suitable_face_shapes", [profile.face_shape]);
      }
      
      if (profile?.gender) {
        query = query.or(`gender.eq.${profile.gender},gender.eq.unisex`);
      }

      const { data, error } = await query.limit(4);
      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4">
        {/* Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-3xl font-bold">Best For You</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {recommendations.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Your Style</h1>
          <p className="text-muted-foreground">Find the perfect glasses that match your personality</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Frame Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="aviator">Aviator</SelectItem>
              <SelectItem value="wayfarer">Wayfarer</SelectItem>
              <SelectItem value="cat_eye">Cat Eye</SelectItem>
              <SelectItem value="round">Round</SelectItem>
              <SelectItem value="rectangular">Rectangular</SelectItem>
              <SelectItem value="oversized">Oversized</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No products found matching your filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
