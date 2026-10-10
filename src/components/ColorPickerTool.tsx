import React, { useState } from 'react';
import type { CharacterItem, PaletteType } from '../utils/mudae';
import {
  PALETTE_OPTIONS,
  parseMudaeInput,
  extractPaletteFromImage,
} from '../utils/mudae';
import { DiscordEmbedPreview } from './DiscordEmbedPreview';
import {
  Palette,
  Sparkles,
  ClipboardList,
  CheckCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

export const ColorPickerTool: React.FC = () => {
  const [inputText, setInputText] = useState(
    `Bennia · :bronzekey:  (2) - https://mudae.net/uploads/4486291/7uFR_Al~t6f4zwS.png
Ookami Mio · :bronzekey:  (1) - https://mudae.net/uploads/1597508/i7PwfPF~ibL69r7.png
Leoparde · :bronzekey:  (1) - https://mudae.net/uploads/1486190/HvZfN-A~ZpJLvRe.png
Moona Hoshinova · :bronzekey:  (1) - https://mudae.net/uploads/7673964/dMek3rY~vzqcLNv.png
Touko Fukawa · :bronzekey:  (1) - https://mudae.net/uploads/4751267/_5Gnjce~g4z9cpa5v97.png`
  );

  const [selectedPaletteType, setSelectedPaletteType] =
    useState<PaletteType>('Vibrant');
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleProcess = async () => {
    const parsed = parseMudaeInput(inputText);
    if (parsed.length === 0) {
      alert('No se detectaron personajes con enlaces de imagen válidos.');
      return;
    }

    setCharacters(parsed);
    setIsProcessing(true);

    const updatedChars = [...parsed];

    for (let i = 0; i < updatedChars.length; i++) {
      try {
        const { palette } = await extractPaletteFromImage(
          updatedChars[i].imageUrl
        );
        updatedChars[i].palette = palette;
        updatedChars[i].selectedColor =
          (palette && palette[selectedPaletteType]) ||
          (palette && palette.Vibrant) ||
          (palette && palette.DarkVibrant) ||
          '#5865f2';
        updatedChars[i].loading = false;
      } catch {
        updatedChars[i].loading = false;
        updatedChars[i].error = 'No se pudo cargar la imagen para extraer colores.';
        updatedChars[i].selectedColor = '#5865f2';
      }
      // Progressive update
      setCharacters([...updatedChars]);
    }

    setIsProcessing(false);
  };

  const handlePaletteTypeChange = (type: PaletteType) => {
    setSelectedPaletteType(type);
    setCharacters((prev) =>
      prev.map((char) => {
        if (!char.palette) return char;
        const newColor =
          char.palette[type] ||
          char.palette.Vibrant ||
          char.selectedColor ||
          '#5865f2';
        return {
          ...char,
          selectedColor: newColor,
        };
      })
    );
  };

  const handleCharColorChange = (charId: string, newColor: string) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, selectedColor: newColor } : c))
    );
  };

  const handleCopyAll = () => {
    if (characters.length === 0) return;
    const commands = characters
      .map((c) => `$ec ${c.name} $ ${c.selectedColor || '#5865f2'}`)
      .join('\n');
    navigator.clipboard.writeText(commands);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Instructions header banner */}
      <div className="bg-[#1e1f22]/70 border border-[#2b2d31] rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            Ejecuta <span className="bg-[#111214] text-amber-300 font-mono px-1.5 py-0.5 rounded text-xs">$mmysi-c-</span> en tu canal de Mudae y copia/pega el resultado que te envíe por DM aquí debajo.
          </p>
          <p className="text-xs text-gray-400">
            La herramienta extraerá los colores de las imágenes para personalizar el embed con el comando <span className="font-mono text-emerald-400">$ec &lt;Personaje&gt; $ &lt;Color&gt;</span>.
          </p>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-[#16171d] border border-[#23242c] rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Pega aquí la lista de Mudae:
          </label>
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Bennia · :bronzekey: (2) - https://mudae.net/uploads/..."
            className="w-full bg-[#0d0e12] border border-[#2b2d31] rounded-xl p-4 font-mono text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Color Palette Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            ¿Qué tipo de color prefieres?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {PALETTE_OPTIONS.map((option) => {
              const isSelected = selectedPaletteType === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handlePaletteTypeChange(option)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-[#1e1f22]/50 border-[#2b2d31] text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-500'
                        : 'border-gray-500'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analizando imágenes...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analizar y Generar Colores
              </>
            )}
          </button>

          {characters.length > 0 && (
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2b2d31] hover:bg-[#383a40] text-gray-200 text-sm font-medium rounded-xl transition-all cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  ¡Todos los comandos copiados!
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4" />
                  Copiar todos los comandos ({characters.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results / Embed Previews */}
      {characters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Resultados ({characters.length})
            </h2>
            <span className="text-xs text-gray-400">
              Haz clic en cualquier tonalidad para cambiar el color
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {characters.map((char) => (
              <DiscordEmbedPreview
                key={char.id}
                item={char}
                currentColor={char.selectedColor || '#5865f2'}
                onColorChange={(color) => handleCharColorChange(char.id, color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
