import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw, Move, Maximize2, ArrowUpDown } from "lucide-react";

export interface ARAdjustments {
  offsetX: number;
  offsetY: number;
  scale: number;
  verticalTilt: number;
}

interface ARControlsProps {
  adjustments: ARAdjustments;
  onChange: (adjustments: ARAdjustments) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const defaultAdjustments: ARAdjustments = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  verticalTilt: 0,
};

const ARControls = ({ adjustments, onChange, isVisible, onToggle }: ARControlsProps) => {
  const handleReset = () => {
    onChange(defaultAdjustments);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-20 left-4 z-30 bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-medium hover:bg-white/20 transition-all flex items-center gap-2"
      >
        <Move className="h-3 w-3" />
        Adjust Fit
      </button>
    );
  }

  return (
    <div className="absolute top-20 left-4 z-30 bg-black/80 backdrop-blur-md rounded-xl p-4 w-64 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-medium">Adjust Glasses Fit</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
            title="Reset to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Horizontal Position */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/70 text-xs flex items-center gap-1.5">
              <Move className="h-3 w-3" />
              Horizontal
            </label>
            <span className="text-white/50 text-xs">{adjustments.offsetX > 0 ? '+' : ''}{adjustments.offsetX.toFixed(1)}</span>
          </div>
          <Slider
            value={[adjustments.offsetX]}
            min={-0.5}
            max={0.5}
            step={0.02}
            onValueChange={([value]) => onChange({ ...adjustments, offsetX: value })}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&_.bg-primary]:bg-primary/50"
          />
        </div>

        {/* Vertical Position */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/70 text-xs flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3" />
              Vertical
            </label>
            <span className="text-white/50 text-xs">{adjustments.offsetY > 0 ? '+' : ''}{adjustments.offsetY.toFixed(1)}</span>
          </div>
          <Slider
            value={[adjustments.offsetY]}
            min={-0.5}
            max={0.5}
            step={0.02}
            onValueChange={([value]) => onChange({ ...adjustments, offsetY: value })}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&_.bg-primary]:bg-primary/50"
          />
        </div>

        {/* Size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/70 text-xs flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3" />
              Size
            </label>
            <span className="text-white/50 text-xs">{(adjustments.scale * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[adjustments.scale]}
            min={0.3}
            max={1.5}
            step={0.02}
            onValueChange={([value]) => onChange({ ...adjustments, scale: value })}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&_.bg-primary]:bg-primary/50"
          />
        </div>

        {/* Vertical Tilt */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/70 text-xs flex items-center gap-1.5">
              <span className="text-[10px]">↕️</span>
              Tilt
            </label>
            <span className="text-white/50 text-xs">{adjustments.verticalTilt > 0 ? '+' : ''}{adjustments.verticalTilt.toFixed(1)}°</span>
          </div>
          <Slider
            value={[adjustments.verticalTilt]}
            min={-15}
            max={15}
            step={1}
            onValueChange={([value]) => onChange({ ...adjustments, verticalTilt: value })}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&_.bg-primary]:bg-primary/50"
          />
        </div>
      </div>

      <p className="text-white/40 text-[10px] mt-3 text-center">
        Fine-tune for a perfect fit
      </p>
    </div>
  );
};

export default ARControls;
export { defaultAdjustments };
