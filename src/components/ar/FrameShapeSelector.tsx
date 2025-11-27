import { cn } from "@/lib/utils";

export type FrameShape = "round" | "aviator" | "cat_eye" | "rectangular" | "oversized" | "thin_metal";

interface FrameShapeSelectorProps {
  selectedShape: FrameShape;
  onSelect: (shape: FrameShape) => void;
}

const frameShapes: { id: FrameShape; name: string; icon: string }[] = [
  { id: "round", name: "Round", icon: "○" },
  { id: "aviator", name: "Aviator", icon: "◇" },
  { id: "cat_eye", name: "Cat-eye", icon: "◠" },
  { id: "rectangular", name: "Rectangle", icon: "▭" },
  { id: "oversized", name: "Oversized", icon: "⬭" },
  { id: "thin_metal", name: "Thin Metal", icon: "⊙" },
];

const FrameShapeSelector = ({ selectedShape, onSelect }: FrameShapeSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-2">
      {frameShapes.map((shape) => (
        <button
          key={shape.id}
          onClick={() => onSelect(shape.id)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[70px] p-2 rounded-xl transition-all duration-300",
            "hover:bg-accent/20 focus:outline-none",
            selectedShape === shape.id
              ? "bg-accent/30 ring-2 ring-accent shadow-gold"
              : "bg-card/30"
          )}
        >
          <span className="text-xl mb-1">{shape.icon}</span>
          <span className="text-[10px] font-medium text-foreground/90 whitespace-nowrap">
            {shape.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FrameShapeSelector;