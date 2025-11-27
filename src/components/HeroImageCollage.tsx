import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const images = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=800&fit=crop",
    alt: "Woman wearing stylish glasses"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=400&fit=crop",
    alt: "Man with modern eyewear"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1577744486770-020ab432da65?w=600&h=400&fit=crop",
    alt: "Professional wearing glasses"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=800&fit=crop",
    alt: "Stylish person with frames"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=400&fit=crop",
    alt: "Business professional with eyewear"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1616606103915-dea7be788566?w=600&h=400&fit=crop",
    alt: "Fashion glasses portrait"
  }
];

const HeroImageCollage = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background pt-20">
      <div className="container px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Try-On</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 animate-fade-in-up leading-tight">
              Find Your Perfect
              <span className="block text-accent">Frame Style</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in-up max-w-xl mx-auto lg:mx-0">
              Try on hundreds of stylish frames virtually and discover the perfect match for your face shape.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up">
              <Button asChild size="lg" variant="premium" className="text-base px-8 rounded-xl">
                <Link to="/try-on">Start Virtual Try-On</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all text-base px-8 rounded-xl">
                <Link to="/browse">Browse Collection</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 justify-center lg:justify-start animate-fade-in-up">
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Frame Styles</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-primary">4.9</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>

          {/* Image Collage */}
          <div className="order-1 lg:order-2 animate-fade-in">
            <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto lg:max-w-none">
              {/* Column 1 */}
              <div className="space-y-3 md:space-y-4">
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift">
                  <img 
                    src={images[0].url} 
                    alt={images[0].alt}
                    className="w-full h-48 md:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift">
                  <img 
                    src={images[1].url} 
                    alt={images[1].alt}
                    className="w-full h-32 md:h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3 md:space-y-4 pt-6 md:pt-8">
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift">
                  <img 
                    src={images[2].url} 
                    alt={images[2].alt}
                    className="w-full h-32 md:h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift border-2 border-accent">
                  <img 
                    src={images[3].url} 
                    alt={images[3].alt}
                    className="w-full h-48 md:h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-semibold text-center">
                    Featured Style
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3 md:space-y-4">
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift">
                  <img 
                    src={images[4].url} 
                    alt={images[4].alt}
                    className="w-full h-40 md:h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="relative group overflow-hidden rounded-2xl shadow-elevated hover-lift">
                  <img 
                    src={images[5].url} 
                    alt={images[5].alt}
                    className="w-full h-40 md:h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
    </section>
  );
};

export default HeroImageCollage;
