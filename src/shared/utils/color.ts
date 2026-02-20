export function getColorIndex(
  r: number,
  g: number,
  b: number,
  palette: string[]
): number {
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  return palette.findIndex((p) => p.toLowerCase() === color);
}

/**
 * Build a Map<hexColor, paletteIndex> for O(1) lookups.
 * Call once per palette, then use getColorIndexFast per pixel.
 */
export function buildPaletteLookup(palette: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < palette.length; i++) {
    map.set(palette[i].toLowerCase(), i);
  }
  return map;
}

export function getColorIndexFast(
  r: number,
  g: number,
  b: number,
  lookup: Map<string, number>
): number {
  const color = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  return lookup.get(color) ?? -1;
}
