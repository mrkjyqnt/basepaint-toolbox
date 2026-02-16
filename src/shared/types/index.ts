export interface ThemeData {
  theme: string;
  palette: string[];
  [key: string]: unknown;
}

export interface PixelStroke {
  point: { x: number; y: number };
  color: number;
}

export interface AnimationFrame {
  file: File;
  img: HTMLImageElement;
  name: string;
}
