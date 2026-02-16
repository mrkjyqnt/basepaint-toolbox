import { AnimationFrame, PixelStroke } from "@/shared/types";
import { downloadTextFile } from "@/shared/utils/download";
import { processImageToMap } from "@/features/canvas";

export async function processAnimationFrames(
  frames: AnimationFrame[],
  palette: string[],
  currentCanvasPixels: Map<string, number>,
  onProgress: (frameIndex: number, total: number) => void
): Promise<number> {
  const temporalCanvasMap = new Map(currentCanvasPixels);
  let totalPixelsProcessed = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress(i + 1, frames.length);

    const framePixelsMap = processImageToMap(frame.img, palette);
    const frameResult: PixelStroke[] = [];

    framePixelsMap.forEach((color, key) => {
      const [x, y] = key.split(",").map(Number);
      const temporalColor = temporalCanvasMap.get(key);

      if (temporalColor === undefined || temporalColor !== color) {
        frameResult.push({ point: { x, y }, color });
        temporalCanvasMap.set(key, color);
      }
    });

    totalPixelsProcessed += frameResult.length;

    const frameNumber = String(i + 1).padStart(3, "0");
    const filename = `frame-${frameNumber}-${frame.name.replace(/\.[^/.]+$/, "")}.txt`;
    const content = JSON.stringify(frameResult);

    await new Promise((r) => setTimeout(r, 150));
    downloadTextFile(content, filename);
  }

  return totalPixelsProcessed;
}

export function sortFramesNumerically(frames: AnimationFrame[]): AnimationFrame[] {
  return [...frames].sort((a, b) => {
    const getNumbers = (str: string) => {
      const matches = str.match(/\d+/g);
      return matches ? matches.map(Number) : [];
    };

    const numsA = getNumbers(a.name);
    const numsB = getNumbers(b.name);

    for (let i = 0; i < Math.max(numsA.length, numsB.length); i++) {
      const numA = numsA[i] || 0;
      const numB = numsB[i] || 0;
      if (numA !== numB) return numA - numB;
    }

    return a.name.localeCompare(b.name);
  });
}
