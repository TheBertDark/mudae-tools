import { useState } from 'react';
import { ColorPickerTool } from './components/ColorPickerTool';
import { Palette, Split, Crop, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'color-picker' | 'list-splitter' | 'image-cropper'>('color-picker');

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#16171d]/90 backdrop-blur-md border-b border-[#23242c] px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-[#16171d] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                </div>
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Mudae Tools
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('color-picker')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'color-picker'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#20222a]'
                }`}
              >
                <Palette className="w-4 h-4" />
                Color Picker
              </button>

              <button
                onClick={() => setActiveTab('list-splitter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'list-splitter'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#20222a]'
                }`}
              >
                <Split className="w-4 h-4" />
                List Splitter
              </button>

              <button
                onClick={() => setActiveTab('image-cropper')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'image-cropper'
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#20222a]'
                }`}
              >
                <Crop className="w-4 h-4" />
                Image Cropper
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#20222a] text-gray-400 px-2.5 py-1 rounded-full border border-gray-800">
              v1.0.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {activeTab === 'color-picker' && <ColorPickerTool />}

        {activeTab === 'list-splitter' && (
          <div className="bg-[#16171d] border border-[#23242c] rounded-2xl p-10 text-center max-w-lg mx-auto mt-12 space-y-4">
            <Split className="w-12 h-12 text-teal-400 mx-auto opacity-70" />
            <h2 className="text-xl font-bold text-white">List Splitter</h2>
            <p className="text-sm text-gray-400">
              Herramienta para dividir listas largas de personajes de Mudae en bloques compatibles con el límite de caracteres de Discord (2000 caracteres).
            </p>
            <div className="text-xs font-mono text-teal-400/80 bg-teal-500/10 py-1 px-3 rounded-full inline-block">
              Próximamente disponible
            </div>
          </div>
        )}

        {activeTab === 'image-cropper' && (
          <div className="bg-[#16171d] border border-[#23242c] rounded-2xl p-10 text-center max-w-lg mx-auto mt-12 space-y-4">
            <Crop className="w-12 h-12 text-teal-400 mx-auto opacity-70" />
            <h2 className="text-xl font-bold text-white">Image Cropper</h2>
            <p className="text-sm text-gray-400">
              Herramienta para recortar y optimizar imágenes con las dimensiones exactas recomendadas para el bot Mudae.
            </p>
            <div className="text-xs font-mono text-teal-400/80 bg-teal-500/10 py-1 px-3 rounded-full inline-block">
              Próximamente disponible
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1d1f27] py-6 px-4 text-center text-xs text-gray-500">
        Mudae Tools • Diseñado para la comunidad de Discord y Mudae
      </footer>
    </div>
  );
}

export default App;
