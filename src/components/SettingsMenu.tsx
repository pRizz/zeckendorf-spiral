import { Menu, Moon, Sun, Tag, Gauge, SquareRadical, Info, ExternalLink } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
                <span className="text-sm font-medium">About Zeckendorf Spiral</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Zeckendorf Spiral</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[65vh] pr-4">
                <div className="space-y-5 text-sm text-muted-foreground">
                  {/* Zeckendorf's Theorem */}
                  <section>
                    <h3 className="text-foreground font-semibold mb-2">Zeckendorf&apos;s Theorem</h3>
                    <p>
                      Every positive integer can be uniquely represented as a sum of 
                      <strong className="text-foreground"> non-consecutive Fibonacci numbers</strong>. 
                      This is known as the Zeckendorf representation.
                    </p>
                    <p className="mt-2">
                      For example, 12 = 8 + 3 + 1 (using F₆ + F₄ + F₂). In binary-like notation, 
                      this can be written as <code className="bg-muted px-1 rounded">10101</code>, 
                      where each bit indicates whether to include the corresponding Fibonacci number.
                    </p>
                  </section>

                  {/* Compression Connection */}
                  <section>
                    <h3 className="text-foreground font-semibold mb-2">Fibonacci & Compression</h3>
                    <p>
                      The Zeckendorf representation has interesting compression properties. 
                      Since consecutive 1s are forbidden, we can omit the implied zeros after each 1, 
                      creating a more compact representation for certain numbers.
                    </p>
                    <p className="mt-2">
                      Numbers that decompose into many Fibonacci terms compress better. The 
                      <strong className="text-foreground"> &quot;All Ones Zeckendorf Numbers&quot; (AOZNs)</strong> represent 
                      the optimal case—numbers whose Zeckendorf representation is entirely 1s.
                    </p>
                  </section>

                  {/* All Ones Zeckendorf Numbers */}
                  <section>
                    <h3 className="text-foreground font-semibold mb-2">All Ones Zeckendorf Numbers</h3>
                    <p>
                      An AOZN with <em>n</em> bits represents the sum of <em>n</em> non-consecutive 
                      even-indexed Fibonacci numbers: F₂ + F₄ + F₆ + ... + F₂ₙ.
                    </p>
                    <p className="mt-2">
                      Remarkably, AOZNs grow at the same rate as <strong className="text-foreground">φ² </strong> 
                      (phi squared ≈ 2.618), where φ is the golden ratio. This is faster than binary (2ⁿ) 
                      but slower than 3ⁿ.
                    </p>
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div>1 square: 1 = F₂</div>
                      <div>2 squares: 1 + 3 = 4</div>
                      <div>3 squares: 1 + 3 + 8 = 12</div>
                      <div>4 squares: 1 + 3 + 8 + 21 = 33</div>
                      <div>5 squares: 1 + 3 + 8 + 21 + 55 = 88</div>
                    </div>
                  </section>

                  {/* Square Root Mode */}
                  <section className="border-t border-border pt-4">
                    <h3 className="text-foreground font-semibold mb-2">√Fₙ Mode Explained</h3>
                    <p>
                      When <strong className="text-foreground">√Fₙ Mode</strong> is enabled, each square&apos;s 
                      side length is √F₂ₙ instead of F₂ₙ. This means each square&apos;s 
                      <strong className="text-foreground"> area equals the Fibonacci number itself</strong>.
                    </p>
                    <p className="mt-2">
                      The total area of all squares becomes F₂ + F₄ + F₆ + ... + F₂ₙ, which equals 
                      the <strong className="text-foreground">All Ones Zeckendorf Number</strong> with 
                      the same number of 1-bits as squares shown.
                    </p>
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg text-xs">
                      <div className="font-medium text-foreground mb-1">Example with 5 squares:</div>
                      <div>Areas: 1 + 3 + 8 + 21 + 55 = <strong className="text-primary">88</strong></div>
                      <div className="mt-1 text-muted-foreground">
                        88 in Zeckendorf = <code className="bg-muted px-1 rounded">11111</code> (5 ones)
                      </div>
                    </div>
                  </section>

                  {/* Golden Spiral */}
                  <section className="border-t border-border pt-4">
                    <h3 className="text-foreground font-semibold mb-2">The Golden Spiral</h3>
                    <p>
                      The spiral drawn through the squares approximates a logarithmic spiral with 
                      growth factor φ (phi ≈ 1.618). This pattern appears throughout nature—from 
                      nautilus shells to spiral galaxies to phyllotactic patterns in plants.
                    </p>
                  </section>

                  {/* Links */}
                  <section className="border-t border-border pt-4 space-y-2">
                    <a 
                      href="https://zeckendorf.lovable.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Live App: zeckendorf.lovable.app</span>
                    </a>
                    <a 
                      href="https://github.com/pRizz/zeckendorf-spiral"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Source Code on GitHub</span>
                    </a>
                    <a 
                      href="https://medium.com/@peterryszkiewicz/exploring-fibonacci-based-compression-8713770f5598"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs">Read more: Exploring Fibonacci Based Compression</span>
                    </a>
                  </section>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
