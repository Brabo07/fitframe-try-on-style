import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Play, ShoppingBag, X, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Virtual Try-On",
    description: "Upload or take your photo to see how different frames look on your face in real-time.",
    color: "text-primary"
  },
  {
    icon: Play,
    title: "Motion Previews",
    description: "Browse our collection with motion video previews to see frames from every angle.",
    color: "text-accent"
  },
  {
    icon: ShoppingBag,
    title: "Easy Checkout",
    description: "Add your prescription details and checkout seamlessly with secure payment.",
    color: "text-primary"
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ tutorial_completed: true })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error("Error updating tutorial status:", error);
    }
    
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-elevated animate-scale-in overflow-hidden">
        <div className="relative">
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            aria-label="Skip tutorial"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Progress indicator */}
          <div className="flex gap-1 p-4 pb-0">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <CardContent className="pt-8 pb-4 text-center">
          <div 
            key={currentStep}
            className="animate-fade-in-up"
          >
            <div className={`inline-flex p-4 rounded-full bg-muted mb-6 ${steps[currentStep].color}`}>
              <CurrentIcon className="h-10 w-10" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">
              {steps[currentStep].title}
            </h2>
            
            <p className="text-muted-foreground text-base leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3 p-6 pt-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Skip
          </Button>
          <Button 
            onClick={handleNext}
            className="flex-1 hover-lift"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              "Got It!"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingTutorial;
