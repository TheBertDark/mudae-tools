import React, { useState } from 'react';
import type { CharacterItem } from '../utils/mudae';
import {
  parseMudaeInput,
  extractPaletteFromImage,
} from '../utils/mudae';
import { DiscordEmbedPreview } from './DiscordEmbedPreview';
import { useLanguage } from '../context/LanguageContext';
import {
  Sparkles,
  ClipboardList,
  CheckCheck,
  RefreshCw,
  Info,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';

export const ColorPickerTool: React.FC = () => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState(
    `Bennia · :bronzekey:  (2) - https://mudae.net/uploads/4486291/7uFR_Al~t6f4zwS.png
Ookami Mio · :bronzekey:  (1) - https://mudae.net/uploads/1597508/i7PwfPF~ibL69r7.png
Leoparde · :bronzekey:  (1) - https://mudae.net/uploads/1486190/HvZfN-A~ZpJLvRe.png
Moona Hoshinova · :bronzekey:  (1) - https://mudae.net/uploads/7673964/dMek3rY~vzqcLNv.png
Touko Fukawa · :bronzekey:  (1) - https://mudae.net/uploads/4751267/_5Gnjce~g4z9cpa5v97.png`
  );

  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedBannerCommand, setCopiedBannerCommand] = useState(false);

  const handleProcess = async () => {
    const parsed = parseMudaeInput(inputText);
    if (parsed.length === 0) {
      alert(t('cp.pasteLabel'));
      return;
    }

    setCharacters(parsed);
    setIsProcessing(true);

    const updatedChars = [...parsed];

    for (let i = 0; i < updatedChars.length; i++) {
      try {
        const { palette, bestColor, workingUrl } = await extractPaletteFromImage(
          updatedChars[i].imageUrl
        );
        updatedChars[i].palette = palette;
        updatedChars[i].displayImageUrl = workingUrl;
        updatedChars[i].selectedColor = bestColor || '#5865f2';
        updatedChars[i].loading = false;
      } catch {
        updatedChars[i].loading = false;
        updatedChars[i].error = 'Error loading image.';
        updatedChars[i].selectedColor = '#5865f2';
      }
      setCharacters([...updatedChars]);
    }

    setIsProcessing(false);
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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#171922] via-[#1a1c27] to-[#171922] border border-[#2b2e3e] rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-3.5 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-sm text-gray-300 space-y-1.5 flex-1">
          <p className="flex items-center flex-wrap gap-2 text-gray-200">
            <span>{t('cp.step1')}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('$mmysi-c-');
                setCopiedBannerCommand(true);
                setTimeout(() => setCopiedBannerCommand(false), 2000);
              }}
              title={t('cp.step1Copy')}
              className={`inline-flex items-center gap-2 font-mono text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-sm ${
                copiedBannerCommand
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#101117] text-amber-300 hover:text-amber-200 border-[#2a2c3a] hover:border-amber-400/50 hover:bg-[#151620]'
              }`}
            >
              {copiedBannerCommand ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('cp.copied')}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">$mmysi-c-</span>
                  <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                </>
              )}
            </button>
            <span>{t('cp.step2')}</span>
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('cp.headerDesc')}
          </p>
        </div>
      </div>

      <div className="bg-[#13141c]/90 border border-[#222432] rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-sm space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-200 tracking-wide flex items-center gap-2">
            <span>{t('cp.pasteLabel')}</span>
            <span className="text-xs font-normal text-gray-500 font-mono">
              (1 / línea)
            </span>
          </label>
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t('cp.btnClear')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('cp.btnClear')}
            </button>
          )}
        </div>

        <div className="relative group">
          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Bennia · :bronzekey: (2) - https://mudae.net/uploads/..."
            className="w-full bg-[#0b0c10] border border-[#222533] rounded-2xl p-4 font-mono text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all resize-y shadow-inner leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-[#1e202c]">
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-teal-950/50 hover:shadow-teal-900/40 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                {t('cp.btnExtracting')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-100" />
                {t('cp.btnExtract')}
              </>
            )}
          </button>

          {characters.length > 0 && (
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1e202c] hover:bg-[#282a3a] text-gray-200 text-xs sm:text-sm font-semibold rounded-xl border border-[#2e3142] transition-all cursor-pointer shadow-md hover:border-gray-500/40"
            >
              {copiedAll ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">{t('cp.allCopied')}</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  <span>{t('cp.copyAll')} ({characters.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {characters.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <span>{t('cp.charactersFound')}</span>
              <span className="text-xs bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                {characters.length}
              </span>
            </h2>
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
