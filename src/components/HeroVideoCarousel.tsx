import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from "lucide-react";

const videos = [
  {
    id: 1,
    url: "https://videos.pexels.com/video-files/5699838/5699838-hd_1080_1920_25fps.mp4",
    title: "Modern Aviators",
    subtitle: "Classic style meets modern design"
  },
  {
    id: 2,
    url: "https://videos.pexels.com/video-files/4429122/4429122-hd_1080_1920_25fps.mp4",
    title: "Bold Frames",
    subtitle: "Make a statement"
  },
  {
    id: 3,
    url: "https://videos.pexels.com/video-files/4429134/4429134-hd_1080_1920_25fps.mp4",
    title: "Elegant Cat-Eye",
    subtitle: "Timeless sophistication"
  },
  {
    id: 4,
    url: "https://videos.pexels.com/video-files/5537587/5537587-hd_1280_720_30fps.mp4",
    title: "Minimalist Round",
    subtitle: "Simple yet stunning"
  }
];

const HeroVideoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video slides */}
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            className="h-full w-full object-cover"
            src={video.url}
            muted={isMuted}
            loop
            playsInline
            autoPlay={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            key={currentIndex}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 animate-fade-in-up"
          >
            Try On Stylish Frames Instantly
          </h1>
          <p 
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 animate-fade-in-up stagger-1"
          >
            Explore frames through real videos and motion previews
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
            <Button asChild size="lg" className="text-base px-8 hover:scale-105 transition-all">
              <Link to="/try-on">Start Virtual Try-On</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/20 backdrop-blur-sm border-2 hover:bg-background/40 hover:scale-105 transition-all text-base px-8">
              <Link to="/browse">Browse Collection</Link>
            </Button>
          </div>
        </div>

        {/* Current video info */}
        <div className="absolute bottom-32 left-4 md:left-8 text-left animate-slide-in-left">
          <p className="text-sm text-muted-foreground mb-1">{videos[currentIndex].subtitle}</p>
          <h3 className="text-xl md:text-2xl font-semibold text-foreground">{videos[currentIndex].title}</h3>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-4">
        <button
          onClick={goToPrevious}
          className="p-3 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-all"
          aria-label="Previous video"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="p-3 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-all"
          aria-label="Next video"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-all ml-4"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>
    </section>
  );
};

export default HeroVideoCarousel;
