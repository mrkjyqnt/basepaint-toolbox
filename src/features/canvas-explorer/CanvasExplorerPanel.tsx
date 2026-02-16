"use client";

import { useState, useCallback } from "react";
import { ThemeData } from "@/shared/types";
import { downloadBlob } from "@/shared/utils/download";
import { getDay, fetchTheme, generatePaletteBlob } from "@/features/theme";
import { fetchCanvasImageBlob } from "@/features/canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Palette, ImageDown, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function CanvasExplorerPanel() {
  const [dayInput, setDayInput] = useState(() => String(getDay()));
  const [loadedDay, setLoadedDay] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getDay();

  const handleLoad = useCallback(async () => {
    const day = parseInt(dayInput);
    if (isNaN(day) || day < 0) {
      setError("Please enter a valid day number (0 or higher)");
      return;
    }
    if (day > today) {
      setError(`Day ${day} hasn't happened yet. Today is day ${today}.`);
      return;
    }

    setLoading(true);
    setError(null);
    setTheme(null);
    setCanvasUrl(null);
    setLoadedDay(null);

    try {
      const [themeData, canvasBlob] = await Promise.all([
        fetchTheme(day),
        fetchCanvasImageBlob(day),
      ]);

      setTheme(themeData);
      setCanvasUrl(URL.createObjectURL(canvasBlob));
      setLoadedDay(day);
    } catch {
      setError("Failed to load data for this day. It may not exist.");
    } finally {
      setLoading(false);
    }
  }, [dayInput, today]);

  const stepDay = useCallback((delta: number) => {
    setDayInput((prev) => {
      const next = Math.max(0, Math.min(today, (parseInt(prev) || 0) + delta));
      return String(next);
    });
  }, [today]);

  const handleDownloadCanvas = useCallback(() => {
    if (!canvasUrl || loadedDay === null) return;
    fetch(canvasUrl)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(blob, `canvas-day-${loadedDay}.png`));
  }, [canvasUrl, loadedDay]);

  const handleDownloadPalette = useCallback(async () => {
    if (!theme || loadedDay === null) return;
    const blob = await generatePaletteBlob(theme.palette);
    downloadBlob(blob, `palette-day-${loadedDay}-${theme.theme}.png`);
  }, [theme, loadedDay]);

  return (
    <div className="space-y-4">
      {/* Day picker */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => stepDay(-1)}
            disabled={loading || parseInt(dayInput) <= 0}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={dayInput}
            onChange={(e) => setDayInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            min={0}
            max={today}
            className="w-24 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => stepDay(1)}
            disabled={loading || parseInt(dayInput) >= today}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={handleLoad} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {loading ? "Loading..." : "Load Day"}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDayInput(String(today));
          }}
          className="w-full sm:w-auto"
        >
          Today ({today})
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Loaded content */}
      {theme && loadedDay !== null && (
        <div className="space-y-4">
          {/* Theme info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-lg font-bold">
              Day {loadedDay} — {theme.theme}
            </h3>
            <Badge variant="outline">{theme.palette.length} colors</Badge>
          </div>

          {/* Canvas preview + actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Canvas image */}
            <div className="w-full max-w-[256px] mx-auto sm:mx-0 space-y-2">
              <div className="aspect-square border-2 border-dashed border-border bg-muted/50">
                {canvasUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={canvasUrl}
                    alt={`Canvas day ${loadedDay}`}
                    width={256}
                    height={256}
                    className="w-full h-full"
                    style={{ imageRendering: "pixelated" }}
                  />
                )}
              </div>
              {/* Download buttons under preview */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDownloadCanvas}
                >
                  <ImageDown className="mr-1 h-3 w-3" />
                  Canvas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDownloadPalette}
                >
                  <Palette className="mr-1 h-3 w-3" />
                  Palette
                </Button>
              </div>
            </div>

            {/* Palette swatches */}
            <div className="flex-1 w-full min-w-0 space-y-2">
              <p className="text-xs text-muted-foreground">Palette</p>
              <ScrollArea className="w-full">
                <div className="flex gap-1 pb-2">
                  {theme.palette.map((color, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          className="shrink-0 w-8 h-8 rounded-sm border border-border cursor-default"
                          style={{ backgroundColor: color }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{color}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!theme && !loading && !error && (
        <div className="w-full max-w-[256px] aspect-square mx-auto flex items-center justify-center border-2 border-dashed border-border bg-muted/50">
          <p className="text-sm text-muted-foreground text-center px-4">
            Enter a day number and click Load to preview
          </p>
        </div>
      )}
    </div>
  );
}
