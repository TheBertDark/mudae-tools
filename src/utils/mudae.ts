import { Vibrant } from 'node-vibrant/browser';

export interface CharacterItem {
  id: string;
  name: string;
  rawLine: string;
  imageUrl: string;
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

export type PaletteType =
  | 'Vibrant'
  | 'Muted'
  | 'DarkVibrant'
  | 'DarkMuted'
  | 'LightVibrant'
  | 'LightMuted';

export const PALETTE_OPTIONS: PaletteType[] = [
  'Vibrant',
  'Muted',
  'DarkVibrant',
  'DarkMuted',
  'LightVibrant',
  'LightMuted',
];

/**
 * Parses Mudae list output like:
 * Bennia · :bronzekey:  (2) - https://mudae.net/uploads/4486291/7uFR_Al~t6f4zwS.png
 * Rem - https://imgur.com/xyz.jpg
 * Megumin $ https://...
 */
export function parseMudaeInput(input: string): CharacterItem[] {
  const lines = input.split('\n');
  const items: CharacterItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    // Look for URL pattern
    const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
    const imageUrl = urlMatch ? urlMatch[0] : '';

    // Everything before the URL or hyphen separator
    let namePart = raw;
    if (urlMatch) {
      namePart = raw.slice(0, urlMatch.index).trim();
    }

    // Clean up trailing separators like '-', '·', ':'
    namePart = namePart.replace(/[-–—·:]+$/, '').trim();

    // Look for optional keys or parenthesis like "· :bronzekey:  (2)"
    let keysInfo = '';
    const keyMatch = namePart.match(/[·•-]?\s*(:\w+:.*)$/);
    if (keyMatch) {
      keysInfo = keyMatch[1].trim();
      namePart = namePart.slice(0, keyMatch.index).trim();
    }

    // Clean name from trailing bullets or dashes again
    namePart = namePart.replace(/[·•–—\-]+$/, '').trim();

    if (imageUrl) {
      items.push({
        id: `char-${i}-${Date.now()}`,
        name: namePart || `Character #${i + 1}`,
        rawLine: raw,
        imageUrl,
        keysInfo,
        loading: true,
      });
    }
  }

  return items;
}

// Proxies as fallback if direct fetch hits CORS
const CORS_PROXIES = [
  (url: string) => url, // Mudae natively supports CORS
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

export async function extractPaletteFromImage(
  url: string
): Promise<{ palette: CharacterItem['palette']; fallbackUsed?: boolean }> {
  let lastError: unknown = null;

  for (let p = 0; p < CORS_PROXIES.length; p++) {
    const proxyUrl = CORS_PROXIES[p](url);
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      const imgLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image in DOM'));
        img.src = proxyUrl;
      });

      // Timeout after 6s for a proxy attempt
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loading image')), 6000)
      );

      const loadedImg = await Promise.race([imgLoaded, timeout]);

      // Extract colors using Vibrant
      const paletteBuilder = await Vibrant.from(loadedImg).getPalette();

      const palette: CharacterItem['palette'] = {
        Vibrant: paletteBuilder.Vibrant?.hex,
        Muted: paletteBuilder.Muted?.hex,
        DarkVibrant: paletteBuilder.DarkVibrant?.hex,
        DarkMuted: paletteBuilder.DarkMuted?.hex,
        LightVibrant: paletteBuilder.LightVibrant?.hex,
        LightMuted: paletteBuilder.LightMuted?.hex,
      };

      return { palette, fallbackUsed: p > 0 };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not extract palette');
}
