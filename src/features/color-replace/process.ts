function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function extractPalette(image: HTMLImageElement): string[] {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const colorCounts = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const hex = rgbToHex(data[i], data[i + 1], data[i + 2]).toLowerCase();
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);
}

export function replaceColors(
  image: HTMLImageElement,
  colorMap: Map<string, string>
): Blob | null {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);

  if (colorMap.size === 0) {
    const dataUrl = canvas.toDataURL("image/png");
    const binary = atob(dataUrl.split(",")[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: "image/png" });
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const lookupMap = new Map<string, { r: number; g: number; b: number }>();
  for (const [oldHex, newHex] of colorMap) {
    const rgb = hexToRgb(newHex);
    if (rgb) {
      lookupMap.set(oldHex.toLowerCase(), rgb);
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;

    const hex = rgbToHex(data[i], data[i + 1], data[i + 2]).toLowerCase();
    const replacement = lookupMap.get(hex);
    if (replacement) {
      data[i] = replacement.r;
      data[i + 1] = replacement.g;
      data[i + 2] = replacement.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");
  const binary = atob(dataUrl.split(",")[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: "image/png" });
}
