import { ThemeData } from "@/shared/types";

const START_DATE = Date.parse("2023-08-08T16:41:05Z");

export function getDay(): number {
  const diffInMs = Date.now() - START_DATE;
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

export async function fetchTheme(day: number): Promise<ThemeData> {
  const url = `https://basepaint.xyz/api/theme/${day}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return res.json();
  }
}

export function generatePaletteBlob(palette: string[]): Promise<Blob> {
  const squareSize = 50;
  const canvas = document.createElement("canvas");
  canvas.width = palette.length * squareSize;
  canvas.height = squareSize;
  const ctx = canvas.getContext("2d")!;

  palette.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * squareSize, 0, squareSize, squareSize);
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}
