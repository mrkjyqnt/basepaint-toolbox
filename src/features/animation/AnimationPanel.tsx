"use client";

import { useRef, useState, useCallback } from "react";
import { ThemeData, AnimationFrame } from "@/shared/types";
import { validateImageSize } from "@/shared/utils/image";
import { fetchCurrentCanvasMap } from "@/features/canvas";
import { getDay } from "@/features/theme";
import { processAnimationFrames, sortFramesNumerically } from "./process";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Play } from "lucide-react";

interface AnimationPanelProps {
  theme: ThemeData;
}

export default function AnimationPanel({ theme }: AnimationPanelProps) {
  const [frames, setFrames] = useState<AnimationFrame[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [totalPixelsResult, setTotalPixelsResult] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadFrames = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      try {
        const validated: AnimationFrame[] = [];
        for (const file of files) {
          const img = await validateImageSize(file);
          validated.push({ file, img, name: file.name });
        }

        const sorted = sortFramesNumerically(validated);
        setFrames(sorted);
        setTotalPixelsResult(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error loading frames");
        setFrames([]);
      }
    },
    []
  );

  const handleProcess = useCallback(async () => {
    if (frames.length === 0) return;

    setProcessing(true);
    setStatus("Fetching current canvas...");

    try {
      const canvasMap = await fetchCurrentCanvasMap(getDay(), theme.palette);

      const total = await processAnimationFrames(
        frames,
        theme.palette,
        canvasMap,
        (current, total) => setStatus(`Processing frame ${current}/${total}...`)
      );

      setTotalPixelsResult(total);
      setStatus(`Done! ${frames.length} frames processed`);
      setTimeout(() => setStatus(""), 3000);
    } catch {
      alert("Error processing frames. Please try again.");
      setStatus("");
    } finally {
      setProcessing(false);
    }
  }, [frames, theme.palette]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4 shrink-0" />
          Load Multiple Frames
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleLoadFrames}
        />

        {frames.length > 0 && (
          <p className="text-sm">
            <strong>Frames loaded:</strong>{" "}
            <Badge variant="secondary">{frames.length}</Badge>
          </p>
        )}

        <Button
          variant="outline"
          className="w-full"
          disabled={frames.length === 0 || processing}
          onClick={handleProcess}
        >
          <Play className="mr-2 h-4 w-4 shrink-0" />
          {status || "Process Frames"}
        </Button>

        {totalPixelsResult !== null && (
          <p className="text-sm font-bold">
            Total pixels processed:{" "}
            <Badge variant="secondary">{totalPixelsResult}</Badge>
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground max-w-[500px]">
        Note: Animation processing frame to code is a new feature and may fail. Please verify all files were generated correctly before saving.
      </p>
    </div>
  );
}
