import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getOptimizedImageUrl } from '../utils/mudae';
import goldKeyIcon from '../assets/goldkey.webp';
import {
  Upload,
  Link as LinkIcon,
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw as ResetIcon,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  ZoomIn,
  Layers,
  Terminal,
  X,
  ArrowRight,
} from 'lucide-react';

type AspectRatioPreset = 'mudae' | 'portrait' | 'anime' | 'classic' | 'square' | 'free';

interface CropRect {
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  width: number; // percentage 0..100
  height: number; // percentage 0..100
}

const ASPECT_RATIOS: Record<AspectRatioPreset, number | null> = {
  mudae: 9 / 14, // 0.6428 - Standard Mudae roll card
  portrait: 2 / 3, // 0.6667 - Standard portrait
  anime: 9 / 16, // 0.5625 - Full phone / wallpaper
  classic: 3 / 4, // 0.75 - Classic 4:3 portrait
  square: 1 / 1, // 1.0 - Avatar / thumbnail
  free: null, // Free form
};

const COLOR_PRESETS = [
  '#00ffe5', // Mudae Teal / Cyan
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#2b2d31', // Discord Dark
];

const SAMPLE_IMAGES = [
  {
    name: 'Bennia',
    series: 'Mudae Original',
    url: 'https://mudae.net/uploads/4486291/7uFR_Al~t6f4zwS.png',
  },
  {
    name: 'Ookami Mio',
    series: 'Hololive',
    url: 'https://mudae.net/uploads/1597508/i7PwfPF~ibL69r7.png',
  },
  {
    name: 'Leoparde',
    series: 'Mudae Original',
    url: 'https://mudae.net/uploads/1486190/HvZfN-A~ZpJLvRe.png',
  },
  {
    name: 'Moona Hoshinova',
    series: 'Hololive',
    url: 'https://mudae.net/uploads/7673964/dMek3rY~vzqcLNv.png',
  },
];

export const ImageCropperTool: React.FC = () => {
  const { t } = useLanguage();

  // Mode tab on initial screen
  const [initialInputMode, setInitialInputMode] = useState<'url' | 'upload'>('url');

  // Image source state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('character');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);

  // Natural image dimensions
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Editor states
  const [preset, setPreset] = useState<AspectRatioPreset>('mudae');
  const [crop, setCrop] = useState<CropRect>({ x: 10, y: 10, width: 80, height: 80 });
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  // Export settings
  const [outputFormat, setOutputFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [quality, setQuality] = useState<number>(90);
  const [resolutionPreset, setResolutionPreset] = useState<'standard' | 'hd' | 'native'>('standard');

  // Preview & Metadata
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<string>('0 KB');
  const [outputDims, setOutputDims] = useState<{ width: number; height: number }>({ width: 225, height: 350 });

  // Discord Embed customization
  const [charName, setCharName] = useState<string>('Hatsune Miku');
  const [charSeries, setCharSeries] = useState<string>('Vocaloid');
  const [embedColor, setEmbedColor] = useState<string>('#00ffe5');
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevBlobUrlRef = useRef<string | null>(null);

  const setManagedImageSrc = useCallback((newSrc: string) => {
    if (prevBlobUrlRef.current && prevBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
    }
    if (newSrc.startsWith('blob:')) {
      prevBlobUrlRef.current = newSrc;
    } else {
      prevBlobUrlRef.current = null;
    }
    setImageSrc(newSrc);
  }, []);

  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current && prevBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, []);

  // Dragging crop state
  const dragActionRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | null;
    startX: number;
    startY: number;
    startCrop: CropRect;
  }>({ type: null, startX: 0, startY: 0, startCrop: { x: 0, y: 0, width: 0, height: 0 } });

  // Helper to parse text that may contain character name, series and URL
  const parseMudaeUrlText = (text: string) => {
    const raw = text.trim();
    const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) return null;

    const url = urlMatch[0];
    let rest = raw.replace(url, '').trim();
    let name = '';
    let series = '';

    if (rest.includes('-')) {
      const parts = rest.split('-');
      name = parts[0].trim();
      series = parts.slice(1).join('-').trim();
    } else if (rest) {
      name = rest;
    }

    return { url, name, series };
  };

  // Convert remote URL to local Blob ObjectURL via proxy
  const loadUrlAsBlob = async (targetUrl: string): Promise<string> => {
    // 1. Try via weserv proxy
    const proxied = getOptimizedImageUrl(targetUrl);
    try {
      const res = await fetch(proxied);
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Continue to next strategy
    }

    // 2. Try via allorigins proxy
    try {
      const allorigins = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(allorigins);
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Continue to next strategy
    }

    // 3. Fallback direct targetUrl
    return targetUrl;
  };

  // Main loader for URL
  const handleLoadFromUrl = async (rawInput: string) => {
    const parsed = parseMudaeUrlText(rawInput);
    const targetUrl = parsed ? parsed.url : rawInput.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setUrlError('Por favor ingresa una URL válida (http/https).');
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      const objectUrl = await loadUrlAsBlob(targetUrl);

      // Extract filename / character name if parsed
      if (parsed?.name) {
        setCharName(parsed.name);
        setImageName(parsed.name.replace(/[^a-zA-Z0-9]/g, '_'));
      }
      if (parsed?.series) {
        setCharSeries(parsed.series);
      }

      setManagedImageSrc(objectUrl);
      setUrlInput('');
      setShowUrlModal(false);
    } catch {
      setUrlError('No se pudo cargar la imagen desde ese enlace. Verifica que sea accesible.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Calculate default crop rectangle given natural image aspect ratio and preset ratio
  const calculateDefaultCrop = useCallback(
    (imgW: number, imgH: number, targetPreset: AspectRatioPreset): CropRect => {
      const targetRatio = ASPECT_RATIOS[targetPreset];
      if (!targetRatio || imgW <= 0 || imgH <= 0) {
        return { x: 5, y: 5, width: 90, height: 90 };
      }

      const imgRatio = imgW / imgH;

      let cropW: number;
      let cropH: number;

      if (imgRatio > targetRatio) {
        // Image is wider than crop target
        cropH = 0.9;
        cropW = (cropH * imgH * targetRatio) / imgW;
      } else {
        // Image is taller than crop target
        cropW = 0.9;
        cropH = (cropW * imgW) / (imgH * targetRatio);
      }

      const x = (1 - cropW) / 2;
      const y = (1 - cropH) / 2;

      return {
        x: Math.max(0, x * 100),
        y: Math.max(0, y * 100),
        width: Math.min(100, cropW * 100),
        height: Math.min(100, cropH * 100),
      };
    },
    []
  );

  // Load image from File
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setImageName(nameWithoutExt);
    setCharName(nameWithoutExt.replace(/[-_]/g, ' '));

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setManagedImageSrc(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Global paste handler: supports both file pasting AND URL text pasting!
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 1. Check if user pasted an image file
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }

      // 2. Check if user pasted a text containing a URL
      const text = e.clipboardData?.getData('text');
      if (text && text.includes('http')) {
        const parsed = parseMudaeUrlText(text);
        if (parsed?.url) {
          e.preventDefault();
          handleLoadFromUrl(text);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFile]);

  // Image load handler
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImgNaturalSize({ width: w, height: h });
    setCrop(calculateDefaultCrop(w, h, preset));
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
  };

  // Handle preset change
  const handlePresetChange = (newPreset: AspectRatioPreset) => {
    setPreset(newPreset);
    if (imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
      setCrop(calculateDefaultCrop(imgNaturalSize.width, imgNaturalSize.height, newPreset));
    }
  };

  // Reset editor
  const handleReset = () => {
    if (imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
      setCrop(calculateDefaultCrop(imgNaturalSize.width, imgNaturalSize.height, preset));
    }
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
  };

  // Generate cropped canvas and update live preview (optimized via requestAnimationFrame)
  useEffect(() => {
    if (!imageSrc || !imgRef.current || imgNaturalSize.width <= 0) return;

    let animId: number;

    const render = () => {
      const img = imgRef.current;
      if (!img) return;
      const canvas = canvasRef.current || document.createElement('canvas');

      // Determine target dimensions
      let targetW = 225;
      let targetH = 350;

      const cropPxW = (crop.width / 100) * imgNaturalSize.width;
      const cropPxH = (crop.height / 100) * imgNaturalSize.height;

      if (resolutionPreset === 'standard') {
        if (preset === 'square') {
          targetW = 300;
          targetH = 300;
        } else if (preset === 'anime') {
          targetW = 225;
          targetH = 400;
        } else {
          targetW = 225;
          targetH = 350;
        }
      } else if (resolutionPreset === 'hd') {
        if (preset === 'square') {
          targetW = 600;
          targetH = 600;
        } else if (preset === 'anime') {
          targetW = 450;
          targetH = 800;
        } else {
          targetW = 450;
          targetH = 700;
        }
      } else {
        // Native resolution
        targetW = Math.max(1, Math.round(cropPxW));
        targetH = Math.max(1, Math.round(cropPxH));
      }

      setOutputDims({ width: targetW, height: targetH });
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, targetW, targetH);

      // Coordinate calculation
      const srcX = (crop.x / 100) * imgNaturalSize.width;
      const srcY = (crop.y / 100) * imgNaturalSize.height;
      const srcW = Math.max(1, (crop.width / 100) * imgNaturalSize.width);
      const srcH = Math.max(1, (crop.height / 100) * imgNaturalSize.height);

      // Apply rotation & flip transformations
      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.scale(zoom, zoom);
      ctx.translate(-targetW / 2, -targetH / 2);

      try {
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);
      } catch {
        // Cross-origin image fallback
      }
      ctx.restore();

      const mime = outputFormat === 'webp' ? 'image/webp' : outputFormat === 'png' ? 'image/png' : 'image/jpeg';
      const q = quality / 100;

      try {
        const dataUrl = canvas.toDataURL(mime, q);
        setPreviewDataUrl(dataUrl);

        // Estimate file size based on base64 length
        const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        const byteLength = (base64Length * 3) / 4;
        if (byteLength < 1024) {
          setEstimatedSize(`${byteLength.toFixed(0)} B`);
        } else if (byteLength < 1024 * 1024) {
          setEstimatedSize(`${(byteLength / 1024).toFixed(1)} KB`);
        } else {
          setEstimatedSize(`${(byteLength / (1024 * 1024)).toFixed(2)} MB`);
        }
      } catch {
        // Ignored if tainted
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [imageSrc, crop, rotation, flipH, flipV, zoom, outputFormat, quality, resolutionPreset, preset, imgNaturalSize]);

  // Pointer event handlers for interactive crop box
  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragActionRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const action = dragActionRef.current;
    if (!action.type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = ((e.clientX - action.startX) / rect.width) * 100;
    const dy = ((e.clientY - action.startY) / rect.height) * 100;

    const start = action.startCrop;
    const targetRatio = ASPECT_RATIOS[preset];

    let newX = start.x;
    let newY = start.y;
    let newW = start.width;
    let newH = start.height;

    if (action.type === 'move') {
      newX = Math.max(0, Math.min(100 - start.width, start.x + dx));
      newY = Math.max(0, Math.min(100 - start.height, start.y + dy));
      setCrop({ x: newX, y: newY, width: start.width, height: start.height });
      return;
    }

    // Handles resizing
    if (action.type === 'se') {
      newW = Math.max(10, Math.min(100 - start.x, start.width + dx));
      if (targetRatio && imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
        newH = (newW * imgNaturalSize.width) / (imgNaturalSize.height * targetRatio);
        if (newY + newH > 100) {
          newH = 100 - newY;
          newW = (newH * imgNaturalSize.height * targetRatio) / imgNaturalSize.width;
        }
      } else {
        newH = Math.max(10, Math.min(100 - start.y, start.height + dy));
      }
    } else if (action.type === 'nw') {
      const maxDx = start.width - 10;
      const appliedDx = Math.min(maxDx, Math.max(-start.x, dx));
      newX = start.x + appliedDx;
      newW = start.width - appliedDx;

      if (targetRatio && imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
        newH = (newW * imgNaturalSize.width) / (imgNaturalSize.height * targetRatio);
        newY = start.y + (start.height - newH);
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.height;
          newW = (newH * imgNaturalSize.height * targetRatio) / imgNaturalSize.width;
          newX = start.x + (start.width - newW);
        }
      } else {
        const maxDy = start.height - 10;
        const appliedDy = Math.min(maxDy, Math.max(-start.y, dy));
        newY = start.y + appliedDy;
        newH = start.height - appliedDy;
      }
    } else if (action.type === 'ne') {
      newW = Math.max(10, Math.min(100 - start.x, start.width + dx));
      if (targetRatio && imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
        newH = (newW * imgNaturalSize.width) / (imgNaturalSize.height * targetRatio);
        newY = start.y + (start.height - newH);
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.height;
          newW = (newH * imgNaturalSize.height * targetRatio) / imgNaturalSize.width;
        }
      } else {
        const maxDy = start.height - 10;
        const appliedDy = Math.min(maxDy, Math.max(-start.y, dy));
        newY = start.y + appliedDy;
        newH = start.height - appliedDy;
      }
    } else if (action.type === 'sw') {
      const maxDx = start.width - 10;
      const appliedDx = Math.min(maxDx, Math.max(-start.x, dx));
      newX = start.x + appliedDx;
      newW = start.width - appliedDx;

      if (targetRatio && imgNaturalSize.width > 0 && imgNaturalSize.height > 0) {
        newH = (newW * imgNaturalSize.width) / (imgNaturalSize.height * targetRatio);
        if (newY + newH > 100) {
          newH = 100 - newY;
          newW = (newH * imgNaturalSize.height * targetRatio) / imgNaturalSize.width;
          newX = start.x + (start.width - newW);
        }
      } else {
        newH = Math.max(10, Math.min(100 - start.y, start.height + dy));
      }
    } else if (action.type === 's') {
      newH = Math.max(10, Math.min(100 - start.y, start.height + dy));
    } else if (action.type === 'n') {
      const maxDy = start.height - 10;
      const appliedDy = Math.min(maxDy, Math.max(-start.y, dy));
      newY = start.y + appliedDy;
      newH = start.height - appliedDy;
    } else if (action.type === 'e') {
      newW = Math.max(10, Math.min(100 - start.x, start.width + dx));
    } else if (action.type === 'w') {
      const maxDx = start.width - 10;
      const appliedDx = Math.min(maxDx, Math.max(-start.x, dx));
      newX = start.x + appliedDx;
      newW = start.width - appliedDx;
    }

    setCrop({
      x: Math.max(0, Math.min(100, newX)),
      y: Math.max(0, Math.min(100, newY)),
      width: Math.max(5, Math.min(100, newW)),
      height: Math.max(5, Math.min(100, newH)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragActionRef.current = {
      type: null,
      startX: 0,
      startY: 0,
      startCrop: { x: 0, y: 0, width: 0, height: 0 },
    };
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Download action
  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    const cleanName = (charName || imageName || 'mudae_character')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanName}_mudae.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy to clipboard
  const handleCopyClipboard = async () => {
    if (!canvasRef.current && !previewDataUrl) return;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopiedClipboard(true);
          setTimeout(() => setCopiedClipboard(false), 2500);
        } catch {
          alert('No se pudo copiar la imagen automáticamente. Usa el botón de Descargar.');
        }
      }, 'image/png');
    } catch {
      alert('Tu navegador no permite copiar imágenes al portapapeles directamente. Descárgala.');
    }
  };

  // Copy Mudae commands
  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const commandAimText = `$aim ${charName || 'Personaje'} <URL>`;
  const commandImText = `$im ${charName || 'Personaje'} <URL>`;

  return (
    <div className="space-y-8 select-none">
      {/* Hidden offscreen canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f212e] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-inner">
              <Crop className="w-6 h-6" />
            </span>
            {t('cropper.title')}
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {t('cropper.subtitle')}
          </p>
        </div>

        {/* Change image buttons (when an image is currently active) */}
        {imageSrc && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowUrlModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161722] hover:bg-[#1f2130] text-teal-300 hover:text-teal-200 border border-teal-500/30 transition cursor-pointer shadow-sm"
            >
              <LinkIcon className="w-4 h-4 text-teal-400" />
              {t('cropper.changeFromUrl')}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161722] hover:bg-[#1f2130] text-gray-300 hover:text-white border border-[#2b2d3e] transition cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4 text-gray-400" />
              {t('cropper.changeFromFile')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal to load a new URL when an image is already active */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#12131c] border border-[#232536] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-teal-400" />
                {t('cropper.tabUrl')}
              </h3>
              <button
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlError(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1c28] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {t('cropper.urlHelper')}
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoadFromUrl(urlInput);
                  }}
                  placeholder={t('cropper.pasteUrlPlaceholder')}
                  className="flex-1 bg-[#0b0c12] border border-[#262838] focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 outline-none transition font-mono"
                  autoFocus
                />
                <button
                  onClick={() => handleLoadFromUrl(urlInput)}
                  disabled={!urlInput.trim() || isLoadingUrl}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  {isLoadingUrl ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t('cropper.loadFromUrlBtn')}
                </button>
              </div>

              {urlError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5 font-mono">
                  {urlError}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[#1e202e] flex justify-end">
              <button
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initial Image Selector Screen (Tabs for URL / File upload) */}
      {!imageSrc ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Tab Selector */}
          <div className="flex items-center justify-center">
            <div className="bg-[#12131c]/90 border border-[#222432] p-1.5 rounded-2xl shadow-xl flex gap-2">
              <button
                onClick={() => {
                  setInitialInputMode('url');
                  setUrlError(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  initialInputMode === 'url'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-teal-400" />
                {t('cropper.tabUrl')}
              </button>

              <button
                onClick={() => {
                  setInitialInputMode('upload');
                  setUrlError(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  initialInputMode === 'upload'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <Upload className="w-4 h-4 text-teal-400" />
                {t('cropper.tabUpload')}
              </button>
            </div>
          </div>

          {/* Option A: Link / URL Input View */}
          {initialInputMode === 'url' ? (
            <div className="bg-[#12131c]/90 border border-[#222432] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
              <div className="space-y-2 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shadow-inner mx-auto">
                  <LinkIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {t('cropper.tabUrl')}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('cropper.urlHelper')}
                </p>
              </div>

              {/* Large URL Input Bar */}
              <div className="space-y-2 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLoadFromUrl(urlInput);
                      }}
                      placeholder={t('cropper.pasteUrlPlaceholder')}
                      className="w-full bg-[#0b0c12] border border-[#262838] focus:border-teal-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-gray-200 outline-none transition font-mono shadow-inner"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={() => handleLoadFromUrl(urlInput)}
                    disabled={!urlInput.trim() || isLoadingUrl}
                    className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#0b0c12] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 font-black shrink-0"
                  >
                    {isLoadingUrl ? (
                      <Sparkles className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>{t('cropper.loadFromUrlBtn')}</span>
                  </button>
                </div>

                {urlError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 font-mono">
                    {urlError}
                  </p>
                )}
              </div>

              {/* Quick Sample Characters */}
              <div className="pt-4 border-t border-[#1e202e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-gray-400 font-medium">
                  {t('cropper.sampleTitle')}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => {
                        setCharName(sample.name);
                        setCharSeries(sample.series);
                        handleLoadFromUrl(sample.url);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#171924] hover:bg-[#202232] text-teal-300 hover:text-white border border-[#27293b] hover:border-teal-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-sm font-mono text-[11px]"
                    >
                      <Sparkles className="w-3 h-3 text-teal-400" />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paste helper badge */}
              <div className="text-center pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-teal-300/90 font-mono bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  {t('cropper.pasteHint')}
                </span>
              </div>
            </div>
          ) : (
            /* Option B: File Upload / Drag & Drop View */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-4 shadow-2xl backdrop-blur-sm ${
                dragOver
                  ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
                  : 'border-[#282b3d] bg-[#12131c]/90 hover:border-teal-500/50 hover:bg-[#161724]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 shadow-inner group-hover:scale-110 transition duration-300">
                <Upload className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t('cropper.dropzoneTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t('cropper.dropzoneSub')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-teal-300 font-mono bg-teal-500/15 border border-teal-500/30 px-3.5 py-1.5 rounded-full shadow-sm">
                <Layers className="w-3.5 h-3.5" />
                {t('cropper.pasteHint')}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Active Workspace: Editor & Live Preview */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Cropper Canvas */}
          <div className="lg:col-span-7 space-y-5">
            {/* Aspect ratio selector bar */}
            <div className="bg-[#12131c]/90 border border-[#222432] rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5 text-teal-400" />
                {t('cropper.aspectRatio')}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'mudae', label: t('cropper.aspectMudae'), badge: '9:14' },
                  { id: 'portrait', label: t('cropper.aspectPortrait'), badge: '2:3' },
                  { id: 'anime', label: t('cropper.aspectAnime'), badge: '9:16' },
                  { id: 'classic', label: t('cropper.aspectClassic'), badge: '3:4' },
                  { id: 'square', label: t('cropper.aspectSquare'), badge: '1:1' },
                  { id: 'free', label: t('cropper.aspectFree'), badge: 'Libre' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePresetChange(item.id as AspectRatioPreset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      preset === item.id
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c29] border border-transparent'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport Card */}
            <div className="bg-[#0b0c12] border border-[#222432] rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
              <div
                ref={containerRef}
                className="relative max-w-full max-h-[500px] select-none rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop Source"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoaded}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="max-h-[480px] max-w-full object-contain pointer-events-none select-none rounded-lg"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${
                      flipV ? -1 : 1
                    })`,
                    transition: 'transform 0.15s ease-out',
                  }}
                />

                {/* Darkened backdrop overlay with SVG cut-out */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={`${crop.x}%`}
                        y={`${crop.y}%`}
                        width={`${crop.width}%`}
                        height={`${crop.height}%`}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#crop-mask)" />
                </svg>

                {/* Interactive Crop Frame */}
                <div
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                  className="absolute border-2 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] cursor-move select-none"
                >
                  {/* Rule of thirds grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-teal-300/40" />
                    <div className="border-r border-b border-teal-300/40" />
                    <div className="border-b border-teal-300/40" />
                    <div className="border-r border-b border-teal-300/40" />
                    <div className="border-r border-b border-teal-300/40" />
                    <div className="border-b border-teal-300/40" />
                    <div className="border-r border-teal-300/40" />
                    <div className="border-r border-teal-300/40" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-teal-300 border-2 border-[#0b0c12] rounded-full shadow cursor-nw-resize hover:scale-125 transition"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-teal-300 border-2 border-[#0b0c12] rounded-full shadow cursor-ne-resize hover:scale-125 transition"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-teal-300 border-2 border-[#0b0c12] rounded-full shadow cursor-se-resize hover:scale-125 transition"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-teal-300 border-2 border-[#0b0c12] rounded-full shadow cursor-sw-resize hover:scale-125 transition"
                  />

                  {/* Edge Handles (for free ratio mode) */}
                  {preset === 'free' && (
                    <>
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'n')}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-teal-300 border border-[#0b0c12] rounded-full shadow cursor-n-resize hover:scale-110"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 's')}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-teal-300 border border-[#0b0c12] rounded-full shadow cursor-s-resize hover:scale-110"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'w')}
                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-teal-300 border border-[#0b0c12] rounded-full shadow cursor-w-resize hover:scale-110"
                      />
                      <div
                        onPointerDown={(e) => handlePointerDown(e, 'e')}
                        className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-teal-300 border border-[#0b0c12] rounded-full shadow cursor-e-resize hover:scale-110"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Transform Controls Bar */}
            <div className="bg-[#12131c]/90 border border-[#222432] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
              {/* Zoom slider */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
                  {t('cropper.zoom')}:
                </span>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-28 sm:w-36 accent-teal-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-300 font-bold">
                  {zoom.toFixed(2)}x
                </span>
              </div>

              {/* Rotate & Flip Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  title={t('cropper.rotate')}
                  className="p-2 rounded-xl bg-[#171924] hover:bg-[#202232] text-gray-300 hover:text-white border border-[#2a2c3d] transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title={t('cropper.rotate')}
                  className="p-2 rounded-xl bg-[#171924] hover:bg-[#202232] text-gray-300 hover:text-white border border-[#2a2c3d] transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFlipH((f) => !f)}
                  title={t('cropper.flipH')}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    flipH
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-[#171924] hover:bg-[#202232] text-gray-300 hover:text-white border-[#2a2c3d]'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFlipV((f) => !f)}
                  title={t('cropper.flipV')}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    flipV
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-[#171924] hover:bg-[#202232] text-gray-300 hover:text-white border-[#2a2c3d]'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  title={t('cropper.reset')}
                  className="p-2 rounded-xl bg-[#171924] hover:bg-[#202232] text-rose-400 hover:text-rose-300 border border-[#2a2c3d] transition cursor-pointer"
                >
                  <ResetIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Discord Embed & Export Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Discord Embed Card */}
            <div className="bg-[#12131c]/90 border border-[#222432] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  {t('cropper.previewTitle')}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {outputDims.width} × {outputDims.height} px
                </span>
              </div>

              {/* Realistic Discord Mudae Embed */}
              <div className="bg-[#2b2d31] rounded-xl p-4 shadow-2xl border border-[#1e1f22] flex gap-3.5 items-stretch relative overflow-hidden">
                {/* Embed left colored strip */}
                <div
                  className="w-1.5 rounded-full shrink-0 transition-colors duration-300 shadow-sm"
                  style={{
                    backgroundColor: embedColor,
                    boxShadow: `0 0 12px ${embedColor}66`,
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
                  {/* Cropped Image in Discord Embed */}
                  <div className="relative w-24 h-36 sm:w-28 sm:h-44 shrink-0 rounded-xl overflow-hidden bg-[#1e1f22] border border-[#383a40] shadow-md flex items-center justify-center">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt={charName}
                        draggable={false}
                        className="w-full h-full object-cover rounded-xl select-none"
                      />
                    ) : (
                      <span className="text-xs text-gray-500 font-mono">...</span>
                    )}
                  </div>

                  {/* Character Info */}
                  <div className="flex flex-col justify-between h-full space-y-2 py-0.5 min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-white truncate max-w-[170px]">
                          {charName || 'Character Name'}
                        </span>
                        {/* Gold key badge */}
                        <span className="inline-flex items-center gap-1 bg-[#1e1f22] border border-[#383a40] px-2 py-0.5 rounded-full text-[11px] font-semibold text-gray-200 shadow-sm">
                          <img
                            src={goldKeyIcon}
                            alt="key"
                            draggable={false}
                            className="w-3.5 h-3.5 object-contain select-none"
                          />
                          <span className="text-amber-400 font-mono font-bold">(3)</span>
                        </span>
                      </div>

                      <span className="text-xs text-gray-400 block truncate max-w-[200px]">
                        {charSeries || 'Series / Anime'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#383a40]/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300">
                        <span className="text-amber-400 font-bold">1,480</span>
                        <span className="text-gray-400">ka</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-teal-400 font-semibold">Claim rank #42</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Name, Series & Embed Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-semibold">
                    {t('cropper.charName')}
                  </label>
                  <input
                    type="text"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full bg-[#0b0c12] border border-[#222432] focus:border-teal-400 rounded-xl px-3 py-1.5 text-xs text-gray-200 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-semibold">
                    {t('cropper.charSeries')}
                  </label>
                  <input
                    type="text"
                    value={charSeries}
                    onChange={(e) => setCharSeries(e.target.value)}
                    className="w-full bg-[#0b0c12] border border-[#222432] focus:border-teal-400 rounded-xl px-3 py-1.5 text-xs text-gray-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Color swatches */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-gray-400 font-semibold">
                    {t('cropper.embedBorder')}
                  </label>
                  <span className="text-[11px] font-mono text-teal-300 font-bold">
                    {embedColor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEmbedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-lg transition-transform cursor-pointer border ${
                        embedColor.toLowerCase() === color.toLowerCase()
                          ? 'scale-110 border-white shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={embedColor}
                    onChange={(e) => setEmbedColor(e.target.value)}
                    className="w-6 h-6 rounded-lg bg-transparent cursor-pointer border border-[#2b2d3e]"
                  />
                </div>
              </div>
            </div>

            {/* Export & Download Controls Card */}
            <div className="bg-[#12131c]/90 border border-[#222432] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-400" />
                {t('cropper.resolutionPreset')}
              </span>

              {/* Resolution selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'standard', label: 'Mudae 1x', sub: '225×350' },
                  { id: 'hd', label: 'Mudae HD', sub: '450×700' },
                  { id: 'native', label: 'Nativo', sub: 'Original' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setResolutionPreset(item.id as 'standard' | 'hd' | 'native')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center ${
                      resolutionPreset === item.id
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                        : 'bg-[#0b0c12] hover:bg-[#161724] text-gray-400 border-[#222432]'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{item.sub}</span>
                  </button>
                ))}
              </div>

              {/* Format & Quality */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-semibold">
                    {t('cropper.format')}
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as 'webp' | 'png' | 'jpeg')}
                    className="w-full bg-[#0b0c12] border border-[#222432] focus:border-teal-400 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none font-mono cursor-pointer"
                  >
                    <option value="webp">WebP (Recomendado)</option>
                    <option value="png">PNG (Sin pérdida)</option>
                    <option value="jpeg">JPG / JPEG</option>
                  </select>
                </div>

                {outputFormat !== 'png' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                      <span>{t('cropper.quality')}</span>
                      <span className="font-mono text-teal-300">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full mt-2 accent-teal-400 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-semibold">Compresión</label>
                    <div className="bg-[#0b0c12] border border-[#222432] rounded-xl px-3 py-2 text-xs text-gray-400 font-mono text-center">
                      PNG Lossless
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1 px-1">
                <span>{t('cropper.fileSize')} <strong className="text-teal-300">{estimatedSize}</strong></span>
                <span>{t('cropper.outputDimensions')} <strong className="text-gray-200">{outputDims.width} × {outputDims.height}</strong></span>
              </div>

              {/* Action Buttons: Copy & Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCopyClipboard}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#1a1c29] hover:bg-[#222538] text-teal-300 border border-teal-500/30 transition shadow-sm cursor-pointer"
                >
                  {copiedClipboard ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t('cropper.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('cropper.copyImage')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#0b0c12] shadow-lg shadow-teal-500/20 transition cursor-pointer font-black"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('cropper.downloadImage')}</span>
                </button>
              </div>

              {/* Mudae Commands Quick Copy */}
              <div className="pt-2 border-t border-[#1f212e] space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" />
                  {t('cropper.commandHelper')}
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between bg-[#0b0c12] border border-[#1f212e] rounded-xl px-3 py-1.5 text-xs font-mono">
                    <span className="text-gray-300 truncate">{commandAimText}</span>
                    <button
                      onClick={() => copyCommand(commandAimText)}
                      className="text-teal-400 hover:text-teal-300 transition text-[11px] font-bold ml-2 shrink-0 cursor-pointer"
                    >
                      {copiedCommand === commandAimText ? t('cropper.copied') : t('cp.copy')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b0c12] border border-[#1f212e] rounded-xl px-3 py-1.5 text-xs font-mono">
                    <span className="text-gray-300 truncate">{commandImText}</span>
                    <button
                      onClick={() => copyCommand(commandImText)}
                      className="text-teal-400 hover:text-teal-300 transition text-[11px] font-bold ml-2 shrink-0 cursor-pointer"
                    >
                      {copiedCommand === commandImText ? t('cropper.copied') : t('cp.copy')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
