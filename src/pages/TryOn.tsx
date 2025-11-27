import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ARTryOn from "@/components/ARTryOn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Glasses, Sparkles, ArrowRight } from "lucide-react";
import { glassesStyles } from "@/data/glassesStyles";
import { useNavigate } from "react-router-dom";

const TryOn = () => {
  const [showARTryOn, setShowARTryOn] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Real-Time Tracking",
      description: "Advanced face tracking follows your movements smoothly at 30-60 FPS",
    },
    {
      icon: Glasses,
      title: "Multiple Styles",
      description: "Try on various frame styles including aviators, wayfarers, and more",
    },
    {
      icon: Sparkles,
      title: "Photo Mode",
      description: "Upload a photo or capture a snapshot to save and share",
    },
  ];

  useEffect(() => {
    document.title = "Virtual Try-On | FitFrame";
  }, []);

  return (
    <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container py-8 px-4">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Virtual Try-On Experience
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              See how glasses look on you in real-time using our advanced AR technology.
              No downloads required - works right in your browser.
            </p>
            <Button
              size="lg"
              onClick={() => setShowARTryOn(true)}
              className="gap-2 text-lg px-8 py-6 rounded-full shadow-elegant hover:scale-105 transition-all"
            >
              <Camera className="h-5 w-5" />
              Start Try-On
            </Button>
          </section>

          {/* Features Grid */}
          <section className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/50 border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Available Styles Preview */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Available Styles</h2>
              <Button
                variant="ghost"
                onClick={() => navigate("/catalog")}
                className="gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {glassesStyles.slice(0, 4).map((glasses) => (
                <Card
                  key={glasses.id}
                  className="overflow-hidden cursor-pointer hover:shadow-elegant transition-all hover:scale-105"
                  onClick={() => setShowARTryOn(true)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={glasses.imageUrl}
                      alt={glasses.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{glasses.name}</h3>
                    <p className="text-xs text-muted-foreground">{glasses.category}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-12 px-6 bg-primary/5 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3">Ready to Find Your Perfect Frame?</h2>
            <p className="text-muted-foreground mb-6">
              Browse our full catalog and find glasses that match your style.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/catalog")}
                className="gap-2"
              >
                <Glasses className="h-4 w-4" />
                View Catalog
              </Button>
              <Button
                onClick={() => navigate("/browse")}
                className="gap-2"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </main>

      {showARTryOn && <ARTryOn onClose={() => setShowARTryOn(false)} />}
    </div>
  );
};

export default TryOn;
