import { Share2, Image, FileCode, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { generateSvg } from "@/lib/svgExport";
import { useSettings } from "@/contexts/SettingsContext";

interface ShareMenuProps {
  getCanvas: () => HTMLCanvasElement | null;
  squareCount: number;
}

export function ShareMenu({ getCanvas, squareCount }: ShareMenuProps) {
  const { showLabels, useSqrtMode, lineThickness } = useSettings();
  const getCanvasDataURL = (format: "png" | "jpeg" = "png"): string | null => {
    const canvas = getCanvas();
    if (!canvas) {
      toast.error("Canvas not available");
      return null;
    }
    return canvas.toDataURL(`image/${format}`, 1.0);
  };

  const handleSavePNG = () => {
    const dataURL = getCanvasDataURL("png");
    if (!dataURL) return;

    const link = document.createElement("a");
    link.download = `zeckendorf-spiral-${squareCount}-squares.png`;
    link.href = dataURL;
    link.click();
    toast.success("PNG saved!");
  };

  const handleSaveSVG = () => {
    const canvas = getCanvas();
    if (!canvas) {
      toast.error("Canvas not available");
      return;
    }

    // Get colors from CSS variables
    const styles = getComputedStyle(document.documentElement);
    const getColor = (varName: string, fallback: string) => {
      const value = styles.getPropertyValue(varName).trim();
      return value || fallback;
    };

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const svgContent = generateSvg({
      count: squareCount,
      useSqrtMode,
      showLabels,
      width,
      height,
      padding: Math.min(24, Math.max(12, width * 0.03)),
      lineThickness,
      colors: {
        background: getColor('--canvas', '#1a1a1a'),
        stroke: getColor('--accent-canvas', '#d4a574'),
        fill: getColor('--accent-canvas', '#d4a574'),
        text: getColor('--canvas-text', '#a3a3a3'),
        origin: getColor('--canvas-origin', '#525252'),
        spiral: getColor('--spiral-color', '#e8c49a'),
      },
    });

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `zeckendorf-spiral-${squareCount}-squares.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success("SVG saved!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    const canvas = getCanvas();
    
    if (navigator.share) {
      try {
        // Try to share with image if supported
        if (canvas && navigator.canShare) {
          const blob = await new Promise<Blob | null>((resolve) => 
            canvas.toBlob(resolve, "image/png", 1.0)
          );
          
          if (blob) {
            const file = new File([blob], `zeckendorf-spiral-${squareCount}-squares.png`, { type: "image/png" });
            const shareData = {
              title: "Zeckendorf Spiral",
              text: "Check out this Zeckendorf spiral!",
              url: window.location.href,
              files: [file],
            };
            
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return;
            }
          }
        }
        
        // Fallback to sharing just the link
        await navigator.share({
          title: "Zeckendorf Spiral",
          text: "Check out this Zeckendorf spiral!",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== "AbortError") {
          toast.error("Share failed");
        }
      }
    } else {
      // Fallback for browsers without native share
      handleCopyLink();
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Share or download"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleSavePNG}>
          <Image className="h-4 w-4 mr-2" />
          Save as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSaveSVG}>
          <FileCode className="h-4 w-4 mr-2" />
          Save as SVG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        {canNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
