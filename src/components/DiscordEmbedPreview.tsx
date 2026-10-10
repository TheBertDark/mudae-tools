import React, { useState } from 'react';
import type { CharacterItem } from '../utils/mudae';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface DiscordEmbedPreviewProps {
  item: CharacterItem;
  currentColor: string;
  onColorChange: (newColor: string) => void;
}

export const DiscordEmbedPreview: React.FC<DiscordEmbedPreviewProps> = ({
  item,
  currentColor,
  onColorChange,
}) => {
  const [copied, setCopied] = useState(false);

  // Command to run in discord: $ec Character Name $ #hex
  const mudaeCommand = `$ec ${item.name} $ ${currentColor || '#202225'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mudaeCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1e1f22] border border-[#2b2d31] rounded-lg p-4 shadow-xl flex flex-col md:flex-row gap-5 items-start justify-between transition-all hover:border-[#383a40]">
      {/* Discord Embed card representation */}
      <div className="flex gap-3 items-stretch max-w-full">
        {/* Discord Embed Left Color Strip */}
        <div
          className="w-1.5 rounded-full shrink-0 transition-colors duration-300"
          style={{ backgroundColor: currentColor || '#5865f2' }}
        />

        {/* Content of embed */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Character Image */}
          <div className="relative group w-24 h-36 shrink-0 rounded overflow-hidden bg-[#2b2d31] flex items-center justify-center border border-[#35373c]">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xs text-gray-500">No Image</span>
            )}
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noreferrer"
              title="Abrir imagen original"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Details & Palette Swatches */}
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white leading-tight">
                  {item.name}
                </h3>
                {item.keysInfo && (
                  <span className="text-xs text-yellow-500/90 bg-yellow-500/10 px-2 py-0.5 rounded font-mono">
                    {item.keysInfo}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Sugerido: <span className="font-mono font-medium text-gray-200">{currentColor || 'N/A'}</span>
              </p>
            </div>

            {/* Quick Palette Swatches picker */}
            {item.palette && (
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block">
                  Tonos detectados:
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
                        className={`w-6 h-6 rounded-md transition-transform flex items-center justify-center border ${
                          isSelected
                            ? 'scale-110 ring-2 ring-white border-transparent'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    );
                  })}

                  {/* Custom color picker input */}
                  <div className="relative flex items-center ml-1">
                    <input
                      type="color"
                      value={currentColor || '#5865f2'}
                      onChange={(e) => onColorChange(e.target.value)}
                      title="Elegir color personalizado"
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {item.error && (
              <p className="text-xs text-red-400 font-mono bg-red-950/40 p-1.5 rounded border border-red-900/50">
                {item.error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action / Command Section */}
      <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#2b2d31]">
        <div className="bg-[#111214] border border-[#2b2d31] px-3 py-2 rounded-lg text-sm font-mono text-emerald-400 w-full md:w-auto max-w-sm truncate select-all">
          {mudaeCommand}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all w-full md:w-auto justify-center cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
              : 'bg-[#5865f2] hover:bg-[#4752c4] text-white shadow-lg shadow-indigo-950/50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copiar comando
            </>
          )}
        </button>
      </div>
    </div>
  );
};
