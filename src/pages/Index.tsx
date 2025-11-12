import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Glasses, Sparkles, Camera, Heart } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 md:py-36">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center animate-fade-in">
              <Glasses className="h-20 w-20 text-primary-foreground" />
            </div>
            <h1 className="mb-6 text-5xl md:text-7xl font-bold text-primary-foreground leading-tight animate-slide-up">
              Find Your Perfect Frame
            </h1>
            <p className="mb-10 text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Discover personalized glasses recommendations powered by AI. Try them on virtually and find your ideal style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Button asChild size="lg" className="text-base px-8 hover:scale-105 transition-all">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20 hover:scale-105 transition-all text-base px-8">
                <Link to="/browse">Browse Collection</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 animate-fade-in">
            Why Choose FitFrame?
          </h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="text-center p-8 rounded-lg bg-card shadow-card hover:shadow-hover transition-all duration-300 animate-scale-in border border-border/50">
              <div className="mb-6 flex justify-center">
                <Sparkles className="h-14 w-14 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Personalized Recommendations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get glasses suggestions tailored to your face shape, style preferences, and personality.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-card shadow-card hover:shadow-hover transition-all duration-300 animate-scale-in border border-border/50" style={{ animationDelay: "0.1s" }}>
              <div className="mb-6 flex justify-center">
                <Camera className="h-14 w-14 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Virtual Try-On</h3>
              <p className="text-muted-foreground leading-relaxed">
                See how glasses look on you with our AR-powered virtual try-on feature.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-card shadow-card hover:shadow-hover transition-all duration-300 animate-scale-in border border-border/50" style={{ animationDelay: "0.2s" }}>
              <div className="mb-6 flex justify-center">
                <Heart className="h-14 w-14 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Save Favorites</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bookmark your favorite frames and compare them side by side to make the perfect choice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 animate-fade-in">
            Ready to Find Your Perfect Glasses?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Join thousands of happy customers who found their ideal eyewear with FitFrame.
          </p>
          <div className="animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <Button asChild size="lg" className="text-base px-8 hover:scale-105 transition-all">
              <Link to="/auth">Start Your Journey</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
