import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play } from "lucide-react";

// Real videos of people wearing glasses from Pexels (verified working URLs)
const videos = [
  {
    id: 1,
    url: "https://videos.pexels.com/video-files/5537587/5537587-sd_640_360_30fps.mp4",
    poster: "https://images.pexels.com/videos/5537587/pexels-photo-5537587.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Professional Style",
    subtitle: "Sophisticated frames for every occasion"
  },
  {
    id: 2,
    url: "https://videos.pexels.com/video-files/4429122/4429122-sd_640_360_25fps.mp4",
    poster: "https://images.pexels.com/videos/4429122/pexels-photo-4429122.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Bold & Confident",
    subtitle: "Make a statement with your look"
  },
  {
    id: 3,
    url: "https://videos.pexels.com/video-files/5699838/5699838-sd_640_360_25fps.mp4",
    poster: "https://images.pexels.com/videos/5699838/pexels-photo-5699838.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Casual Elegance",
    subtitle: "Everyday frames with premium quality"
  },
  {
    id: 4,
    url: "https://videos.pexels.com/video-files/6567846/6567846-sd_640_360_30fps.mp4",
    poster: "https://images.pexels.com/videos/6567846/pexels-photo-6567846.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Modern Classic",
    subtitle: "Timeless designs reimagined"
  },
  {
    id: 5,
    url: "https://videos.pexels.com/video-files/5538999/5538999-sd_640_360_30fps.mp4",
    poster: "https://images.pexels.com/videos/5538999/pexels-photo-5538999.jpeg?auto=compress&cs=tinysrgb&w=800",
    title: "Urban Style",
    subtitle: "Street-ready eyewear"
  }
];

const HeroVideoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState<boolean[]>(new Array(videos.length).fill(false));
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.currentTime = 0;
          video.muted = isMuted; // Ensure video is muted for autoplay policy
          video.play().catch((err) => {
            console.log('Video autoplay blocked:', err);
          });
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isMuted]);

  // Initial load - play first video
  useEffect(() => {
    const firstVideo = videoRefs.current[0];
    if (firstVideo) {
      firstVideo.muted = true;
      firstVideo.play().catch(() => {});
    }
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const handleVideoLoad = (index: number) => {
    setIsLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      {/* Video slides */}
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Poster image as background - always visible */}
          <img
            src={video.poster}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Video overlay */}
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              isLoaded[index] ? "opacity-100" : "opacity-0"
            }`}
            src={video.url}
            poster={video.poster}
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            onLoadedData={() => handleVideoLoad(index)}
            onCanPlay={() => handleVideoLoad(index)}
          />
          
          {/* Gradient overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            key={`title-${currentIndex}`}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary mb-4 animate-fade-in-up drop-shadow-lg"
          >
            Try On Stylish Frames Instantly
          </h1>
          <p 
            className="text-lg md:text-xl lg:text-2xl text-foreground/90 mb-8 animate-fade-in-up stagger-1 drop-shadow-md"
          >
            Explore frames through real videos and motion previews
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
            <Button asChild size="lg" variant="premium" className="text-base px-8 rounded-xl">
              <Link to="/try-on">Start Virtual Try-On</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/30 backdrop-blur-sm border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all text-base px-8 rounded-xl">
              <Link to="/browse">Browse Collection</Link>
            </Button>
          </div>
        </div>

        {/* Current video info */}
        <div 
          key={`info-${currentIndex}`}
          className="absolute bottom-32 left-4 md:left-8 text-left animate-slide-in-left"
        >
          <p className="text-sm text-foreground/70 mb-1 drop-shadow">{videos[currentIndex].subtitle}</p>
          <h3 className="text-xl md:text-2xl font-bold text-primary drop-shadow-lg">{videos[currentIndex].title}</h3>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-4">
        <button
          onClick={goToPrevious}
          className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm hover:bg-primary/40 transition-all hover:scale-110"
          aria-label="Previous video"
        >
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>

        {/* Dots indicator */}
        <div className="flex gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? "w-8 bg-accent shadow-gold" 
                  : "w-2 bg-primary/30 hover:bg-primary/50"
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm hover:bg-primary/40 transition-all hover:scale-110"
          aria-label="Next video"
        >
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm hover:bg-primary/40 transition-all hover:scale-110 ml-4"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-primary" />
          ) : (
            <Volume2 className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>

      {/* Video title badges */}
      <div className="absolute top-24 right-4 md:right-8 z-30">
        <div className="bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold shadow-gold animate-fade-in">
          {currentIndex + 1} / {videos.length}
        </div>
      </div>
    </section>
  );
};

export default HeroVideoCarousel;
