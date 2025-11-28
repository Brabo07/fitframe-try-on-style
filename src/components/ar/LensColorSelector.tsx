import { cn } from "@/lib/utils";

export type LensColor = "clear" | "dark" | "brown" | "blue" | "green" | "gradient" | "rose" | "amber";

interface LensColorOption {
  id: LensColor;
  name: string;
  color: string;
  gradient?: string;
}

const lensColors: LensColorOption[] = [
  { id: "clear", name: "Clear", color: "rgba(200, 220, 255, 0.15)" },
  { id: "dark", name: "Dark Tint", color: "rgba(30, 30, 40, 0.65)" },
  { id: "brown", name: "Brown", color: "rgba(139, 90, 43, 0.45)" },
  { id: "blue", name: "Blue Tint", color: "rgba(70, 130, 200, 0.40)" },
  { id: "green", name: "Green", color: "rgba(60, 140, 90, 0.40)" },
  { id: "gradient", name: "Gradient", color: "rgba(80, 80, 100, 0.50)", gradient: "linear-gradient(180deg, rgba(60,60,80,0.7) 0%, rgba(150,150,170,0.2) 100%)" },
  { id: "rose", name: "Rose", color: "rgba(200, 100, 120, 0.35)" },
  { id: "amber", name: "Amber", color: "rgba(220, 160, 60, 0.40)" },
];

interface LensColorSelectorProps {
  selectedColor: LensColor;
  onSelect: (color: LensColor) => void;
}

export const getLensColorValue = (lensColorId: LensColor): string => {
  const option = lensColors.find(c => c.id === lensColorId);
  return option?.color || lensColors[0].color;
};

export const getLensColorHex = (lensColorId: LensColor): string => {
  switch (lensColorId) {
    case "clear": return "#c8dcff";
    case "dark": return "#1e1e28";
    case "brown": return "#8b5a2b";
    case "blue": return "#4682c8";
    case "green": return "#3c8c5a";
    case "gradient": return "#505064";
    case "rose": return "#c86478";
    case "amber": return "#dca03c";
    default: return "#c8dcff";
  }
};

export const getLensOpacity = (lensColorId: LensColor): number => {
  switch (lensColorId) {
    case "clear": return 0.15;
    case "dark": return 0.65;
    case "brown": return 0.45;
    case "blue": return 0.40;
    case "green": return 0.40;
    case "gradient": return 0.50;
    case "rose": return 0.35;
    case "amber": return 0.40;
    default: return 0.25;
  }
};

const LensColorSelector = ({ selectedColor, onSelect }: LensColorSelectorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-primary-foreground/70 px-1">Lens Color</span>
      <div className="flex gap-2 flex-wrap">
        {lensColors.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "relative w-8 h-8 rounded-full transition-all duration-200",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/50",
              "border-2",
              selectedColor === option.id
                ? "border-accent shadow-gold scale-110"
                : "border-primary-foreground/20 hover:border-primary-foreground/40"
            )}
            style={{
              background: option.gradient || option.color,
            }}
            title={option.name}
          >
            {/* Glass shine effect */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
              }}
            />
            {/* Selection indicator */}
            {selectedColor === option.id && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LensColorSelector;
