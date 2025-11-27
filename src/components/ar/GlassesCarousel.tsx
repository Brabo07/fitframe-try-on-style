import { glassesStyles, GlassesStyle } from "@/data/glassesStyles";
import { cn } from "@/lib/utils";

interface GlassesCarouselProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const GlassesCarousel = ({ selectedId, onSelect }: GlassesCarouselProps) => {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-3 px-2 min-w-max">
        {glassesStyles.map((glasses) => (
          <button
            key={glasses.id}
            onClick={() => onSelect(glasses.id)}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl transition-all duration-200",
              "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
              selectedId === glasses.id
                ? "bg-primary/10 ring-2 ring-primary shadow-elegant"
                : "bg-card/50"
            )}
          >
            <div className="w-20 h-12 rounded-lg overflow-hidden mb-1">
              <img
                src={glasses.imageUrl}
                alt={glasses.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
              {glasses.name}
            </span>
            <span className="text-[10px] text-muted-foreground">{glasses.color}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GlassesCarousel;
