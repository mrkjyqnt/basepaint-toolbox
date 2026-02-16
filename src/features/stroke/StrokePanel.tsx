"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ThemeData, PixelStroke } from "@/shared/types";
import { validateImageSize } from "@/shared/utils/image";
import { downloadTextFile } from "@/shared/utils/download";
import { fetchCurrentCanvasMap, fetchCanvasImageBlob } from "@/features/canvas";
import { getDay } from "@/features/theme";
import { processImage, processImageWithFilter } from "./process";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Upload, Copy, Scissors, ShieldOff, Eye, EyeOff } from "lucide-react";

interface StrokePanelProps {
  theme: ThemeData;
}

export default function StrokePanel({ theme }: StrokePanelProps) {
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [totalPixels, setTotalPixels] = useState(0);
  const [filteredPixels, setFilteredPixels] = useState<string>("—");
  const [hasImage, setHasImage] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [splitSize, setSplitSize] = useState("");
  const [splitting, setSplitting] = useState(false);
  const [canvasBgUrl, setCanvasBgUrl] = useState<string | null>(null);
  const [showBg, setShowBg] = useState(true);
  const [bgOpacity, setBgOpacity] = useState(40);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch today's canvas as background
  useEffect(() => {
    fetchCanvasImageBlob(getDay())
      .then((blob) => setCanvasBgUrl(URL.createObjectURL(blob)))
      .catch(() => {});
  }, []);

  const handleLoadImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const img = await validateImageSize(file);
        setLoadedImage(img);
        setImageUrl(URL.createObjectURL(file));
        setHasImage(true);

        const allPixels = processImage(img, theme.palette);
        setTotalPixels(allPixels.length);
        setFilteredPixels("Calculating...");

        fetchCurrentCanvasMap(getDay(), theme.palette)
          .then((canvasMap) => {
            const filtered = processImageWithFilter(img, theme.palette, canvasMap);
            setFilteredPixels(String(filtered.length));
          })
          .catch(() => setFilteredPixels("Error"));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error loading image");
      }
    },
    [theme.palette]
  );

  const handleCopyStroke = useCallback(() => {
    if (!loadedImage) return;
    const pixels = processImage(loadedImage, theme.palette);
    navigator.clipboard.writeText(JSON.stringify(pixels));
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus(""), 2000);
  }, [loadedImage, theme.palette]);

  const handleCopyWithoutOverprinting = useCallback(async () => {
    if (!loadedImage) return;
    setCopyStatus("Downloading Canvas...");
    try {
      const canvasMap = await fetchCurrentCanvasMap(getDay(), theme.palette);
      const filtered = processImageWithFilter(loadedImage, theme.palette, canvasMap);
      navigator.clipboard.writeText(JSON.stringify(filtered));
      setFilteredPixels(String(filtered.length));
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch {
      setCopyStatus("");
      alert("Error processing. Please try again.");
    }
  }, [loadedImage, theme.palette]);

  const handleSplitCode = useCallback(async () => {
    if (!loadedImage) return;
    const size = parseInt(splitSize) || 1000;
    if (size < 1) {
      alert("Please enter a valid number (minimum 1)");
      return;
    }

    setSplitting(true);
    try {
      const canvasMap = await fetchCurrentCanvasMap(getDay(), theme.palette);
      const filtered = processImageWithFilter(loadedImage, theme.palette, canvasMap);

      const sections: PixelStroke[][] = [];
      for (let i = 0; i < filtered.length; i += size) {
        sections.push(filtered.slice(i, i + size));
      }

      const day = getDay();
      downloadTextFile(
        `Total sections: ${sections.length}\nPixels per section: ${size}\nTotal pixels: ${filtered.length}\n\nCanvas: ${day} - ${theme.theme}`,
        `info-${day}.txt`
      );

      for (let i = 0; i < sections.length; i++) {
        const num = String(i + 1).padStart(3, "0");
        await new Promise((r) => setTimeout(r, 100));
        downloadTextFile(
          JSON.stringify(sections[i]),
          `section-${num}-of-${sections.length}.txt`
        );
      }
    } catch {
      alert("Error splitting code. Please try again.");
    } finally {
      setSplitting(false);
    }
  }, [loadedImage, theme, splitSize]);

  return (
    <div className="space-y-5">
      {/* Image preview with canvas background */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full max-w-[256px] aspect-square border border-border rounded-md overflow-hidden bg-muted/50">
          {/* Canvas background layer */}
          {canvasBgUrl && showBg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={canvasBgUrl}
              alt="Canvas background"
              width={256}
              height={256}
              className="absolute inset-0 w-full h-full"
              style={{ imageRendering: "pixelated", opacity: bgOpacity / 100 }}
            />
          )}
          {/* User image layer */}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Loaded"
              width={256}
              height={256}
              className="relative w-full h-full"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full">
              <p className="text-sm text-muted-foreground">No image loaded</p>
            </div>
          )}
        </div>

        {/* Background controls */}
        {canvasBgUrl && (
          <div className="flex items-center gap-3 w-full max-w-[256px]">
            <Toggle
              size="sm"
              variant="outline"
              pressed={showBg}
              onPressedChange={setShowBg}
              aria-label="Toggle canvas background"
            >
              {showBg ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Toggle>
            <Slider
              value={[bgOpacity]}
              onValueChange={([v]) => setBgOpacity(v)}
              max={100}
              step={5}
              disabled={!showBg}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">{bgOpacity}%</span>
          </div>
        )}
      </div>

      {/* Action buttons — centered */}
      <div className="flex flex-col items-center gap-3">
        <Button
          className="w-full max-w-[256px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Load Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLoadImage}
        />

        <Button
          variant="outline"
          className="w-full max-w-[256px]"
          disabled={!hasImage}
          onClick={handleCopyStroke}
        >
          <Copy className="mr-2 h-4 w-4" />
          {copyStatus || "Copy Stroke"}
        </Button>

        <Button
          variant="secondary"
          className="w-full max-w-[256px]"
          disabled={!hasImage}
          onClick={handleCopyWithoutOverprinting}
        >
          <ShieldOff className="mr-2 h-4 w-4" />
          {copyStatus && copyStatus !== "Copied!" ? copyStatus : "Copy Without Overprinting"}
        </Button>

        {hasImage && (
          <div className="flex gap-4 text-sm">
            <span>
              Total: <Badge variant="secondary">{totalPixels}</Badge>
            </span>
            <span>
              Filtered: <Badge variant="secondary">{filteredPixels}</Badge>
            </span>
          </div>
        )}
      </div>

      {/* Split controls — centered */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2 w-full max-w-[256px]">
          <Input
            type="number"
            placeholder="Per section (1000)"
            min={1}
            disabled={!hasImage}
            value={splitSize}
            onChange={(e) => setSplitSize(e.target.value)}
            className="flex-1 text-center"
          />
          <Button
            variant="outline"
            disabled={!hasImage || splitting}
            onClick={handleSplitCode}
          >
            <Scissors className="mr-1 h-4 w-4" />
            {splitting ? "..." : "Split"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[300px]">
          Splits stroke into downloadable sections
        </p>
      </div>
    </div>
  );
}
