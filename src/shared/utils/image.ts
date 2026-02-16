export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Error loading image"));
    img.src = src;
  });
}

export function validateImageSize(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width === 256 && img.height === 256) {
        resolve(img);
      } else {
        reject(new Error("The image must be 256x256px"));
      }
    };
    img.onerror = () => reject(new Error("Error loading image"));
    img.src = URL.createObjectURL(file);
  });
}
