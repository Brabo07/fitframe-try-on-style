import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Camera, Heart, Glasses, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import HeroVideoCarousel from "@/components/HeroVideoCarousel";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tutorial_completed')
          .eq('user_id', user.id)
          .single();
        
        if (profile && !profile.tutorial_completed) {
          setShowTutorial(true);
        }
      }
    };

    checkTutorialStatus();
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: "AI Face Analysis",
      description: "Upload your photo and get personalized frame recommendations based on your face shape."
    },
    {
      icon: Camera,
      title: "Virtual Try-On",
      description: "See how glasses look on you with our AR-powered virtual try-on feature."
    },
    {
      icon: Heart,
      title: "Save Favorites",
      description: "Bookmark your favorite frames and compare them side by side."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Video Carousel */}
      <HeroVideoCarousel />

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Why Choose FitFrame?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of eyewear shopping with our innovative features
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="card-premium hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Face Shape Analysis CTA */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden shadow-elevated animate-fade-in-up">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 w-fit mb-4">
                    <Glasses className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Find Your Perfect Match
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Our AI-powered face shape analysis helps you discover frames that complement your unique features.
                  </p>
                  <Button asChild className="w-fit hover-lift">
                    <Link to="/face-analysis">
                      Analyze My Face Shape
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="bg-gradient-premium p-8 flex items-center justify-center min-h-[250px]">
                  <div className="text-center text-primary-foreground">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 animate-float" />
                    <p className="text-lg font-medium">AI-Powered Analysis</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-hero">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 animate-fade-in-up">
            Ready to Find Your Perfect Glasses?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-1">
            Join thousands of happy customers who found their ideal eyewear with FitFrame.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
            <Button asChild size="lg" variant="secondary" className="text-base px-8 hover:scale-105 transition-all">
              <Link to="/browse">Browse Collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20 text-base px-8">
              <Link to="/try-on">Try Virtual Try-On</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
};

export default Index;
