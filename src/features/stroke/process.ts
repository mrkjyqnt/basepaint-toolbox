import { PixelStroke } from "@/shared/types";
import { buildPaletteLookup, getColorIndexFast } from "@/shared/utils/color";

export function processImage(
  image: HTMLImageElement,
  palette: string[]
): PixelStroke[] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const lookup = buildPaletteLookup(palette);
  const result: PixelStroke[] = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const a = data[index + 3];
      if (a === 0) continue;

      const color = getColorIndexFast(data[index], data[index + 1], data[index + 2], lookup);
      if (color !== -1) {
        result.push({ point: { x, y }, color });
      }
    }
  }

  return result;
}

export function processImageWithFilter(
  image: HTMLImageElement,
  palette: string[],
  currentCanvasPixels: Map<string, number>
): PixelStroke[] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const lookup = buildPaletteLookup(palette);
  const result: PixelStroke[] = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const a = data[index + 3];
      if (a === 0) continue;

      const color = getColorIndexFast(data[index], data[index + 1], data[index + 2], lookup);
      if (color !== -1) {
        const key = `${x},${y}`;
        const currentColor = currentCanvasPixels.get(key);
        if (currentColor === undefined || currentColor !== color) {
          result.push({ point: { x, y }, color });
        }
      }
    }
  }

  return result;
}

export function renderStrokeToBlob(
  pixels: PixelStroke[],
  palette: string[]
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 256);

  pixels.forEach((pixel) => {
    if (pixel.point && typeof pixel.color === "number") {
      const { x, y } = pixel.point;
      const colorIndex = pixel.color;
      if (
        x >= 0 && x < 256 &&
        y >= 0 && y < 256 &&
        colorIndex >= 0 && colorIndex < palette.length
      ) {
        ctx.fillStyle = palette[colorIndex];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
