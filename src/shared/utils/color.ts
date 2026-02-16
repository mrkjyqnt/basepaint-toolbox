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
