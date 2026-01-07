import { Share2, Download, Image, FileCode, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareMenuProps {
  getCanvas: () => HTMLCanvasElement | null;
}

export function ShareMenu({ getCanvas }: ShareMenuProps) {
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
    link.download = "zeckendorf-spiral.png";
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

    // Get the canvas as a data URL and embed it in an SVG
    const dataURL = canvas.toDataURL("image/png", 1.0);
    const width = canvas.width;
    const height = canvas.height;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image xlink:href="${dataURL}" width="${width}" height="${height}"/>
</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = "zeckendorf-spiral.svg";
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
            const file = new File([blob], "zeckendorf-spiral.png", { type: "image/png" });
            const shareData = {
              title: "Zeckendorf Spiral",
              text: "Check out this Fibonacci visualization!",
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
          text: "Check out this Fibonacci visualization!",
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
