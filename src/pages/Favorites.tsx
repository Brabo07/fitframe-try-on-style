import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select(`
            *,
            glasses_products (*)
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setFavorites(data?.map((fav: any) => fav.glasses_products) || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Favorites</h1>
            <p className="text-muted-foreground">Glasses you've saved for later</p>
          </div>
          {favorites.length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                const shareText = `Check out my favorite glasses on FitFrame!\n${window.location.origin}/favorites`;
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: "My FitFrame Favorites",
                      text: shareText,
                      url: window.location.href,
                    });
                    toast.success("Shared successfully!");
                  } else {
                    await navigator.clipboard.writeText(shareText);
                    toast.success("Link copied to clipboard!");
                  }
                } catch (error) {
                  console.error("Error sharing:", error);
                }
              }}
            >
              <Share2 className="h-4 w-4" />
              Share Collection
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">You haven't saved any favorites yet</p>
            <button
              onClick={() => navigate("/browse")}
              className="text-primary hover:underline font-medium"
            >
              Start browsing glasses
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;
