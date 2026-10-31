import React, { useState, useEffect } from 'react';
import type { CharacterItem } from '../utils/mudae';
import { getOptimizedImageUrl } from '../utils/mudae';
import { Copy, Check, ExternalLink } from 'lucide-react';

import bronzeKeyIcon from '../assets/BronzeKey.webp';
import silverKeyIcon from '../assets/silverkey.webp';
import goldKeyIcon from '../assets/goldkey.webp';
import chaosKeyIcon from '../assets/chaoskey.webp';

import { useLanguage } from '../context/LanguageContext';

interface DiscordEmbedPreviewProps {
  item: CharacterItem;
  currentColor: string;
  onColorChange: (newColor: string) => void;
}

const KEY_ICONS: Record<string, string> = {
  bronzekey: bronzeKeyIcon,
  silverkey: silverKeyIcon,
  goldkey: goldKeyIcon,
  chaoskey: chaosKeyIcon,
};

function renderKeysInfo(keysInfo?: string) {
  if (!keysInfo) return null;

  const keyTypeMatch = keysInfo.match(/:(\w+):/);
  const countMatch = keysInfo.match(/\((\d+)\)/);

  const keyName = keyTypeMatch ? keyTypeMatch[1].toLowerCase() : null;
  const count = countMatch ? countMatch[1] : null;

  const iconSrc = keyName ? KEY_ICONS[keyName] : null;

  if (iconSrc) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#171821] border border-[#2e3142] px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-200 shadow-sm">
        <img
          src={iconSrc}
          alt={keyName || 'key'}
          draggable={false}
          className="w-4 h-4 object-contain shrink-0 select-none pointer-events-none"
        />
        {count && <span className="text-amber-400 font-mono text-xs font-bold">({count})</span>}
      </span>
    );
  }

  return (
    <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full font-mono">
      {keysInfo}
    </span>
  );
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({
  item,
  currentColor,
  onColorChange,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.displayImageUrl || getOptimizedImageUrl(item.imageUrl));

  useEffect(() => {
    if (item.displayImageUrl) {
      setImgSrc(item.displayImageUrl);
    }
  }, [item.displayImageUrl]);

  const mudaeCommand = `$ec ${item.name} $ ${currentColor || '#202225'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mudaeCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = () => {
    const optimized = getOptimizedImageUrl(item.imageUrl);
    const allorigins = `https://api.allorigins.win/raw?url=${encodeURIComponent(item.imageUrl)}`;

    if (imgSrc === item.imageUrl) {
      setImgSrc(optimized);
    } else if (imgSrc === optimized) {
      setImgSrc(allorigins);
    } else if (imgSrc === allorigins) {
      setImgSrc(item.imageUrl);
    }
  };

  return (
    <div className="group/card bg-[#14151e]/90 hover:bg-[#181924] border border-[#222432] hover:border-[#333648] rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 flex flex-col md:flex-row gap-5 items-start justify-between">
      <div className="flex gap-3.5 items-stretch max-w-full">
        <div
          className="w-1.5 rounded-full shrink-0 transition-all duration-300 shadow-sm"
          style={{
            backgroundColor: currentColor || '#5865f2',
            boxShadow: `0 0 12px ${currentColor ? currentColor + '55' : 'transparent'}`,
          }}
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative group w-24 h-36 shrink-0 rounded-xl overflow-hidden bg-[#1a1c26] flex items-center justify-center border border-[#2c2f40] shadow-md">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={item.name}
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover rounded-xl select-none transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
            ) : (
              <span className="text-xs text-gray-500 font-mono">No Image</span>
            )}
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noreferrer"
              title="Abrir imagen original"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-xs"
            >
              <ExternalLink className="w-4 h-4 text-white drop-shadow" />
            </a>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-white leading-tight tracking-tight">
                  {item.name}
                </h3>
                {renderKeysInfo(item.keysInfo)}
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <span>{t('cp.customColor')}</span>
                <span className="font-mono font-semibold text-gray-200 bg-[#1c1d29] px-1.5 py-0.5 rounded border border-[#2b2d3d]">
                  {currentColor || 'N/A'}
                </span>
              </p>
            </div>

            {item.palette && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                  {t('cp.palette')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(item.palette).map(([type, hex]) => {
                    if (!hex) return null;
                    const isSelected = hex.toLowerCase() === currentColor?.toLowerCase();
                    return (
                      <button
                        key={type}
                        onClick={() => onColorChange(hex)}
                        title={`${type}: ${hex}`}
                        className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center border cursor-pointer ${
                          isSelected
                            ? 'scale-115 ring-2 ring-white/90 shadow-md border-transparent z-10'
                            : 'border-white/10 hover:scale-110 hover:border-white/40 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />}
                      </button>
                    );
                  })}

                  <div className="relative flex items-center ml-1">
                    <input
                      type="color"
                      value={currentColor || '#5865f2'}
                      onChange={(e) => onColorChange(e.target.value)}
                      title={t('cp.customColor')}
                      className="w-6 h-6 rounded-lg border border-white/20 bg-transparent cursor-pointer hover:border-white/50 transition-colors p-0 overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {item.error && (
              <p className="text-xs text-red-400 font-mono bg-red-950/40 p-2 rounded-lg border border-red-900/50">
                {item.error}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2.5 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#222432]">
        <div
          onClick={handleCopy}
          title={t('cp.copy')}
          className="bg-[#0b0c10] hover:bg-[#12131b] border border-[#222433] hover:border-teal-500/50 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-teal-400 w-full md:w-auto max-w-sm truncate cursor-pointer transition-all select-all flex items-center justify-between gap-3 shadow-inner group"
        >
          <span className="truncate font-semibold">{mudaeCommand}</span>
          <Copy className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0 text-teal-400 transition-opacity" />
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all w-full md:w-auto justify-center cursor-pointer shadow-md ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-950/60'
              : 'bg-[#5865f2] hover:bg-[#4752c4] active:scale-95 text-white shadow-indigo-950/50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> {t('cp.copied')}
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> {t('cp.copy')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
