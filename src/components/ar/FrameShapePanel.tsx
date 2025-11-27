import { useState } from "react";
import { ChevronDown, ChevronUp, Glasses } from "lucide-react";
import { cn } from "@/lib/utils";

export type FrameShape = "round" | "aviator" | "cat_eye" | "rectangular" | "oversized" | "thin_metal" | "wayfarer";

interface FrameShapePanelProps {
  selectedShape: FrameShape;
  onSelect: (shape: FrameShape) => void;
}

const frameShapes: { id: FrameShape; name: string; description: string }[] = [
  { id: "round", name: "Round", description: "Classic circular frames" },
  { id: "aviator", name: "Aviator", description: "Iconic teardrop shape" },
  { id: "cat_eye", name: "Cat-Eye", description: "Retro upswept style" },
  { id: "rectangular", name: "Rectangle", description: "Modern angular look" },
  { id: "oversized", name: "Oversized", description: "Bold statement frames" },
  { id: "thin_metal", name: "Thin Metal", description: "Minimalist wire frames" },
  { id: "wayfarer", name: "Wayfarer", description: "Timeless classic style" },
];

// SVG paths for frame shape icons
const shapeIcons: Record<FrameShape, JSX.Element> = {
  round: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="30" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 10 H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  aviator: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <path d="M2 6 Q10 2 18 8 Q16 16 8 16 Q2 14 2 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38 6 Q30 2 22 8 Q24 16 32 16 Q38 14 38 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 8 H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  cat_eye: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <path d="M2 12 Q2 4 10 4 L16 4 Q18 4 18 8 Q18 14 10 16 Q2 16 2 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38 12 Q38 4 30 4 L24 4 Q22 4 22 8 Q22 14 30 16 Q38 16 38 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 8 H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  rectangular: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <rect x="2" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="24" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10 H24" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  oversized: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <ellipse cx="10" cy="10" rx="9" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="30" cy="10" rx="9" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 10 H21" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  thin_metal: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="30" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M17 10 H23" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  ),
  wayfarer: (
    <svg viewBox="0 0 40 20" className="w-full h-full">
      <path d="M2 6 Q2 4 4 4 L14 4 Q18 4 18 8 L18 12 Q18 16 14 16 L4 16 Q2 16 2 14 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38 6 Q38 4 36 4 L26 4 Q22 4 22 8 L22 12 Q22 16 26 16 L36 16 Q38 16 38 14 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 8 H22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

const FrameShapePanel = ({ selectedShape, onSelect }: FrameShapePanelProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [hoveredShape, setHoveredShape] = useState<FrameShape | null>(null);

  return (
    <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border/30 shadow-elevated overflow-hidden transition-all duration-500">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Glasses className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground">Frame Shape</h3>
            <p className="text-xs text-muted-foreground">
              {frameShapes.find(s => s.id === selectedShape)?.name || "Select a style"}
            </p>
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-full bg-accent/10 transition-transform duration-300",
          isOpen && "rotate-180"
        )}>
          <ChevronDown className="h-4 w-4 text-accent" />
        </div>
      </button>

      {/* Content */}
      <div className={cn(
        "grid transition-all duration-500 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0 space-y-3">
            {/* Selected shape preview */}
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-accent/20">
              <div className="flex items-center justify-center h-16 text-accent">
                {shapeIcons[selectedShape]}
              </div>
              <p className="text-center text-sm font-medium text-foreground mt-2">
                {frameShapes.find(s => s.id === selectedShape)?.description}
              </p>
            </div>

            {/* Shape grid */}
            <div className="grid grid-cols-4 gap-2">
              {frameShapes.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => onSelect(shape.id)}
                  onMouseEnter={() => setHoveredShape(shape.id)}
                  onMouseLeave={() => setHoveredShape(null)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300",
                    "hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/50",
                    selectedShape === shape.id
                      ? "bg-accent/20 ring-2 ring-accent shadow-gold"
                      : "bg-muted/30 hover:scale-105"
                  )}
                >
                  {/* Shape icon */}
                  <div className={cn(
                    "w-10 h-5 mb-1 transition-colors duration-300",
                    selectedShape === shape.id ? "text-accent" : "text-muted-foreground"
                  )}>
                    {shapeIcons[shape.id]}
                  </div>
                  
                  {/* Shape name */}
                  <span className={cn(
                    "text-[10px] font-semibold transition-colors duration-300 whitespace-nowrap",
                    selectedShape === shape.id ? "text-accent" : "text-muted-foreground"
                  )}>
                    {shape.name}
                  </span>

                  {/* Selection indicator */}
                  {selectedShape === shape.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Hover tooltip */}
            {hoveredShape && hoveredShape !== selectedShape && (
              <div className="text-center text-xs text-muted-foreground animate-fade-in">
                {frameShapes.find(s => s.id === hoveredShape)?.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameShapePanel;