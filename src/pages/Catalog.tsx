import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ARTryOn from "@/components/ARTryOn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Filter } from "lucide-react";
import { glassesStyles, GlassesStyle } from "@/data/glassesStyles";
import { cn } from "@/lib/utils";

const categories = ["All", "Aviator", "Wayfarer", "Round", "Cat Eye", "Rectangular", "Oversized", "Geometric", "Clubmaster"];

const Catalog = () => {
  const [showARTryOn, setShowARTryOn] = useState(false);
  const [selectedGlasses, setSelectedGlasses] = useState<GlassesStyle | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredGlasses = activeCategory === "All" 
    ? glassesStyles 
    : glassesStyles.filter(g => g.category === activeCategory);

  const handleTryOn = (glasses: GlassesStyle) => {
    setSelectedGlasses(glasses);
    setShowARTryOn(true);
  };

  useEffect(() => {
    document.title = "Frame Catalog | FitFrame";
  }, []);

  return (
    <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Frame Catalog</h1>
            <p className="text-muted-foreground">
              Explore our collection of {glassesStyles.length} stylish frames
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full whitespace-nowrap",
                  activeCategory === category && "shadow-elegant"
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Glasses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGlasses.map((glasses) => (
              <Card
                key={glasses.id}
                className="group overflow-hidden hover:shadow-elegant transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={glasses.imageUrl}
                    alt={glasses.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3">
                      <Button
                        size="sm"
                        onClick={() => handleTryOn(glasses)}
                        className="w-full gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Try On
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{glasses.name}</h3>
                      <p className="text-sm text-muted-foreground">{glasses.color}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {glasses.category}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-2"
                    onClick={() => handleTryOn(glasses)}
                  >
                    <Camera className="h-4 w-4" />
                    Virtual Try-On
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGlasses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No frames found in this category.</p>
            </div>
          )}
        </main>

      {showARTryOn && (
        <ARTryOn
          product={selectedGlasses ? { frame_style: selectedGlasses.category.toLowerCase(), frame_color: selectedGlasses.color } : undefined}
          onClose={() => {
            setShowARTryOn(false);
            setSelectedGlasses(null);
          }}
        />
      )}
    </div>
  );
};

export default Catalog;
