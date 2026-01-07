import { Menu, Moon, Sun, Tag, Gauge, SquareRadical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";

export function SettingsMenu() {
  const {
    showLabels,
    setShowLabels,
    animationSpeed,
    setAnimationSpeed,
    useSqrtMode,
    setUseSqrtMode,
    theme,
    setTheme,
  } = useSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Settings menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <Separator />

          {/* Show Labels Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Show Labels</span>
            </div>
            <Switch
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
          </div>

          <Separator />

          {/* Animation Speed */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Animation Speed</span>
            </div>
            <div className="flex items-center gap-3 pl-7">
              <span className="text-xs text-muted-foreground">Slow</span>
              <Slider
                value={[animationSpeed]}
                onValueChange={([val]) => setAnimationSpeed(val)}
                min={0.5}
                max={2}
                step={0.25}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Fast</span>
            </div>
          </div>

          <Separator />

          {/* Square Root Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SquareRadical className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">√Fₙ Mode</span>
                <span className="text-xs text-muted-foreground">
                  Use √F₂ₙ for side lengths
                </span>
              </div>
            </div>
            <Switch
              checked={useSqrtMode}
              onCheckedChange={setUseSqrtMode}
            />
          </div>

          <Separator />

          {/* About Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 px-0">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">About Zeckendorf's Theorem</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Zeckendorf's Theorem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Zeckendorf's Theorem</strong> states that every 
                  positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers.
                </p>
                <p>
                  This visualization shows <strong className="text-foreground">even-indexed Fibonacci numbers</strong> (F₂, F₄, F₆, ...) 
                  arranged as squares in a spiral pattern, similar to the golden spiral.
                </p>
                <p>
                  The sequence starts with F₂=1, F₄=3, F₆=8, F₈=21, F₁₀=55... where each even-indexed 
                  Fibonacci number follows the recurrence Fₙ = Fₙ₋₁ + Fₙ₋₂.
                </p>
                <p className="text-xs border-t border-border pt-4">
                  The golden spiral approximates a logarithmic spiral with growth factor φ (phi ≈ 1.618), 
                  the golden ratio.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
