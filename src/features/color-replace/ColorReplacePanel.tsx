"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { validateImageSize } from "@/shared/utils/image";
import { downloadBlob } from "@/shared/utils/download";
import { extractPalette, replaceColors } from "./process";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, ArrowRight, X } from "lucide-react";

export default function ColorReplacePanel() {
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleLoadImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const img = await validateImageSize(file);
        setLoadedImage(img);
        setImageUrl(URL.createObjectURL(file));
        setColorMap(new Map());

        const colors = extractPalette(img);
        setPalette(colors);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error loading image");
      }
    },
    []
  );

  // Compute preview URL from image + colorMap (no useEffect needed)
  const previewUrl = useMemo(() => {
    if (!loadedImage) return null;
    const blob = replaceColors(loadedImage, colorMap);
    if (blob) return URL.createObjectURL(blob);
    return null;
  }, [loadedImage, colorMap]);

  const handleSetColor = useCallback((oldColor: string, newColor: string) => {
    setColorMap((prev) => {
      const next = new Map(prev);
      if (newColor) {
        const normalized = newColor.startsWith("#") ? newColor : `#${newColor}`;
        if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
          next.set(oldColor, normalized.toLowerCase());
        }
      }
      return next;
    });
  }, []);

  const handleClearColor = useCallback((oldColor: string) => {
    setColorMap((prev) => {
      const next = new Map(prev);
      next.delete(oldColor);
      return next;
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!loadedImage) return;
    const blob = replaceColors(loadedImage, colorMap);
    if (blob) {
      downloadBlob(blob, "color-replaced.png");
    }
  }, [loadedImage, colorMap]);

  const hasImage = !!loadedImage;
  const mappedCount = colorMap.size;

  return (
    <div className="space-y-4">
      {/* Load + Download buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Load Image</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleLoadImage}
          />

          <Button
            variant="outline"
            className="flex-1"
            disabled={!hasImage}
            onClick={handleDownload}
          >
            <Download className="mr-1 sm:mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Download</span>
          </Button>
        </div>

        {hasImage && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{palette.length} colors</Badge>
            {mappedCount > 0 && (
              <Badge variant="outline">{mappedCount} replaced</Badge>
            )}
          </div>
        )}
      </div>

      {/* Preview + Palette */}
      {hasImage && (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Preview */}
          <div className="w-full max-w-[256px] mx-auto sm:mx-0 space-y-2">
            <p className="text-xs text-muted-foreground text-center">Preview</p>
            <div className="aspect-square border-2 border-dashed border-border bg-muted/50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  width={256}
                  height={256}
                  className="w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Original"
                  width={256}
                  height={256}
                  className="w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : null}
            </div>
          </div>

          {/* Palette grid */}
          <div className="flex-1 w-full min-w-0">
            <p className="text-xs text-muted-foreground mb-2">
              Click a color to replace it
            </p>
            <ScrollArea className="h-[280px] sm:h-[300px]">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pr-2">
                {palette.map((color) => {
                  const mapped = colorMap.get(color);
                  return (
                    <ColorSwatch
                      key={color}
                      color={color}
                      mappedColor={mapped}
                      onSetColor={handleSetColor}
                      onClearColor={handleClearColor}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {!hasImage && (
        <div className="w-full max-w-[256px] aspect-square mx-auto flex items-center justify-center border-2 border-dashed border-border bg-muted/50">
          <p className="text-sm text-muted-foreground">No image loaded</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" width={256} height={256} />
    </div>
  );
}

function ColorSwatch({
  color,
  mappedColor,
  onSetColor,
  onClearColor,
}: {
  color: string;
  mappedColor?: string;
  onSetColor: (oldColor: string, newColor: string) => void;
  onClearColor: (color: string) => void;
}) {
  const [inputValue, setInputValue] = useState(mappedColor || "");
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Sync input value when popover opens
      setInputValue(mappedColor || "");
    }
  };

  const handleApply = () => {
    if (inputValue.trim()) {
      onSetColor(color, inputValue.trim());
      setOpen(false);
    }
  };

  const handleClear = () => {
    onClearColor(color);
    setInputValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative w-full aspect-square rounded-sm border border-border flex flex-col items-center justify-center text-[9px] leading-tight cursor-pointer hover:ring-2 hover:ring-ring transition-all"
          style={{ backgroundColor: mappedColor || color }}
          title={mappedColor ? `${color} → ${mappedColor}` : color}
        >
          <span
            className="font-mono truncate w-full px-0.5 text-center"
            style={{ color: isLightColor(mappedColor || color) ? "#000" : "#fff" }}
          >
            {(mappedColor || color).slice(1).toUpperCase()}
          </span>
          {mappedColor && (
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white"
              title="Mapped"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3" align="start">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-sm border border-border shrink-0"
            style={{ backgroundColor: color }}
          />
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div
            className="w-8 h-8 rounded-sm border border-border shrink-0"
            style={{ backgroundColor: inputValue && /^#?[0-9a-fA-F]{6}$/.test(inputValue.replace("#", "")) ? (inputValue.startsWith("#") ? inputValue : `#${inputValue}`) : color }}
          />
        </div>
        <div className="space-y-2">
          <Input
            placeholder="New hex (e.g. ff0000)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="text-sm font-mono"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="flex-1">
              Apply
            </Button>
            {mappedColor && (
              <Button size="sm" variant="outline" onClick={handleClear}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
