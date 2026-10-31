import { Vibrant } from 'node-vibrant/browser';

export interface CharacterItem {
  id: string;
  name: string;
  rawLine: string;
  imageUrl: string;
  displayImageUrl?: string;
  keysInfo?: string;
  palette?: {
    Vibrant?: string;
    Muted?: string;
    DarkVibrant?: string;
    DarkMuted?: string;
    LightVibrant?: string;
    LightMuted?: string;
    [key: string]: string | undefined;
  };
  selectedColor?: string;
  loading?: boolean;
  error?: string;
}

export function parseMudaeInput(input: string): CharacterItem[] {
  const lines = input.split('\n');
  const items: CharacterItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
    const imageUrl = urlMatch ? urlMatch[0] : '';

    let namePart = raw;
    if (urlMatch) {
      namePart = raw.slice(0, urlMatch.index).trim();
    }

    namePart = namePart.replace(/[-–—·:]+$/, '').trim();

    let keysInfo = '';
    const keyMatch = namePart.match(/[·•-]?\s*(:\w+:.*)$/);
    if (keyMatch) {
      keysInfo = keyMatch[1].trim();
      namePart = namePart.slice(0, keyMatch.index).trim();
    }

    namePart = namePart.replace(/[·•–—\-]+$/, '').trim();

    if (imageUrl) {
      items.push({
        id: `char-${i}-${Date.now()}`,
        name: namePart || `Character #${i + 1}`,
        rawLine: raw,
        imageUrl,
        displayImageUrl: getOptimizedImageUrl(imageUrl),
        keysInfo,
        loading: true,
      });
    }
  }

  return items;
}

export function getOptimizedImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}`;
}
const IMAGE_CANDIDATE_URLS = [
  (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => url,
];

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

export function scoreSwatchAgainstCanvas(
  swatchHex: string,
  pixelData: Uint8ClampedArray
): number {
  const [sr, sg, sb] = hexToRgb(swatchHex);
  const [sh, ss, sl] = rgbToHsl(sr, sg, sb);

  let matchedPixels = 0;

  for (let i = 0; i < pixelData.length; i += 8) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];
    const a = pixelData[i + 3];

    if (a < 50) continue; 
    if (r > 240 && g > 240 && b > 240) continue; 
    if (r < 25 && g < 25 && b < 25) continue; 

    const [h] = rgbToHsl(r, g, b);
    const hDiff = Math.min(Math.abs(h - sh), 1.0 - Math.abs(h - sh));

    if (hDiff < 0.12) {
      matchedPixels++;
    }
  }
  const satFactor = Math.pow(Math.max(0.1, ss), 0.5);
  const lightFactor = Math.max(0.25, 1.0 - 2.0 * Math.abs(sl - 0.5));

  return matchedPixels * satFactor * lightFactor;
}

export async function extractPaletteFromImage(
  url: string
): Promise<{ palette: CharacterItem['palette']; bestColor: string; workingUrl: string }> {
  let lastError: unknown = null;

  for (let p = 0; p < IMAGE_CANDIDATE_URLS.length; p++) {
    const candidateUrl = IMAGE_CANDIDATE_URLS[p](url);
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      const imgLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image in DOM'));
        img.src = candidateUrl;
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loading image')), 7000)
      );

      const loadedImg = await Promise.race([imgLoaded, timeout]);

      const paletteBuilder = await Vibrant.from(loadedImg).getPalette();

      const palette: CharacterItem['palette'] = {
        Vibrant: paletteBuilder.Vibrant?.hex,
        Muted: paletteBuilder.Muted?.hex,
        DarkVibrant: paletteBuilder.DarkVibrant?.hex,
        DarkMuted: paletteBuilder.DarkMuted?.hex,
        LightVibrant: paletteBuilder.LightVibrant?.hex,
        LightMuted: paletteBuilder.LightMuted?.hex,
      };

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100;
      canvas.height = 140;
      let bestColor = palette.Vibrant || '#5865f2';

      if (ctx) {
        ctx.drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const candidates = Object.values(palette).filter((c): c is string => Boolean(c));
        
        let highestScore = -1;
        for (const hex of candidates) {
          const score = scoreSwatchAgainstCanvas(hex, imgData.data);
          if (score > highestScore) {
            highestScore = score;
            bestColor = hex;
          }
        }
      }

      return { palette, bestColor, workingUrl: candidateUrl };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not extract palette');
}
