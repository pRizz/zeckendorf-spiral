import { Slider } from "@/components/ui/slider";

interface SquareSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function SquareSlider({ value, onChange, min = 1, max = 10 }: SquareSliderProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          Number of Squares
        </label>
        <span className="text-2xl font-bold text-accent-foreground tabular-nums">
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground/60 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
