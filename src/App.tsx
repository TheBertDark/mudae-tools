import { useState } from 'react';
import { ColorPickerTool } from './components/ColorPickerTool';
import { OuroChestSolver } from './components/OuroChestSolver';
import { ImageCropperTool } from './components/ImageCropperTool';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Palette, Grid, Split, Crop } from 'lucide-react';
import mudaeLogo from './assets/mudae.webp';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'color-picker' | 'ouro-chest' | 'list-splitter' | 'image-cropper'>('color-picker');
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-teal-500/10 via-indigo-500/5 to-transparent blur-3xl opacity-70" />
      </div>

      <header className="sticky top-0 z-50 bg-[#12131a]/80 backdrop-blur-xl border-b border-[#1f212d] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300" />
                <img
                  src={mudaeLogo}
                  alt="Mudae Logo"
                  draggable={false}
                  className="relative w-9 h-9 rounded-full object-cover border border-[#2b2d3a] shadow-inner select-none pointer-events-none"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent flex items-center gap-1.5">
                  {t('app.title')}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-gray-400 -mt-0.5 tracking-wider font-medium uppercase">
                  {t('app.subtitle')}
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-1.5 bg-[#0e0f14]/80 p-1 rounded-xl border border-[#1e202b]">
              <button
                onClick={() => setActiveTab('color-picker')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'color-picker'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                {t('nav.colorPicker')}
              </button>

              <button
                onClick={() => setActiveTab('ouro-chest')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'ouro-chest'
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-red-400" />
                {t('nav.ouroChest')}
              </button>

              <button
                onClick={() => setActiveTab('list-splitter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'list-splitter'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                {t('nav.listSplitter')}
              </button>

              <button
                onClick={() => setActiveTab('image-cropper')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'image-cropper'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#181a24] border border-transparent'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                {t('nav.imageCropper')}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0e0f14] border border-[#232534] rounded-xl p-0.5 shadow-sm">
              <button
                onClick={() => setLanguage('es')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  language === 'es'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Cambiar a Español"
              >
                ES
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  language === 'en'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            <span className="text-[11px] font-mono bg-[#161722] text-teal-300/80 px-2.5 py-0.5 rounded-full border border-teal-500/20 shadow-sm">
              v1.2.0
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'color-picker' && <ColorPickerTool />}
        {activeTab === 'ouro-chest' && <OuroChestSolver />}

        {activeTab === 'list-splitter' && (
          <div className="bg-[#13141c] border border-[#222430] rounded-2xl p-12 text-center max-w-md mx-auto mt-14 space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto shadow-inner">
              <Split className="w-8 h-8 text-teal-400 opacity-80" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('nav.listSplitter')}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('splitter.desc')}
            </p>
            <div className="text-xs font-mono text-teal-300 bg-teal-500/15 border border-teal-500/30 py-1 px-3.5 rounded-full inline-block">
              {t('comingSoon')}
            </div>
          </div>
        )}

        {activeTab === 'image-cropper' && <ImageCropperTool />}
      </main>

      <footer className="relative z-10 border-t border-[#181a24] py-6 px-4 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>Mudae Tools</span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span>{t('footer.designedFor')}</span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;

