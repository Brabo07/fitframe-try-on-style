import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Glasses, Sparkles, Camera, Heart } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <Glasses className="h-16 w-16 text-primary-foreground" />
            </div>
            <h1 className="mb-6 text-5xl md:text-6xl font-bold text-primary-foreground">
              Find Your Perfect Frame
            </h1>
            <p className="mb-8 text-xl text-primary-foreground/90">
              Discover personalized glasses recommendations powered by AI. Try them on virtually and find your ideal style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/browse">Browse Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose FitFrame?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
              <p className="text-muted-foreground">
                Get glasses suggestions tailored to your face shape, style preferences, and personality.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="mb-4 flex justify-center">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual Try-On</h3>
              <p className="text-muted-foreground">
                See how glasses look on you with our AR-powered virtual try-on feature.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card shadow-card">
              <div className="mb-4 flex justify-center">
                <Heart className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
              <p className="text-muted-foreground">
                Bookmark your favorite frames and compare them side by side to make the perfect choice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Find Your Perfect Glasses?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who found their ideal eyewear with FitFrame.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth">Start Your Journey</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
