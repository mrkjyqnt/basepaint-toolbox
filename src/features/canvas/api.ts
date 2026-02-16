import { getColorIndex } from "@/shared/utils/color";
import { loadImage } from "@/shared/utils/image";

export async function fetchCanvasImageBlob(day: number): Promise<Blob> {
  const timestamp = Date.now();
  const res = await fetch(
    `/api/basepaint?url=${encodeURIComponent(
      `https://basepaint.xyz/api/art/image?day=${day}&scale=1&t=${timestamp}`
    )}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Error fetching canvas: ${res.statusText}`);
  return res.blob();
}

export function processImageToMap(
  image: HTMLImageElement,
  palette: string[]
): Map<string, number> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 256;

  if (image.width !== 256 || image.height !== 256) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, 256, 256);
  } else {
    ctx.drawImage(image, 0, 0);
  }

  const data = ctx.getImageData(0, 0, 256, 256).data;
  const pixelMap = new Map<string, number>();

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const index = (y * 256 + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a < 128) continue;

      const color = getColorIndex(r, g, b, palette);
      if (color !== -1) {
        pixelMap.set(`${x},${y}`, color);
      }
    }
  }

  return pixelMap;
}

export async function fetchCurrentCanvasMap(
  day: number,
  palette: string[]
): Promise<Map<string, number>> {
  const blob = await fetchCanvasImageBlob(day);
  const img = await loadImage(URL.createObjectURL(blob));
  return processImageToMap(img, palette);
}
