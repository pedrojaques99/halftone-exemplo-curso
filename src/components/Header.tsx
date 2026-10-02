import React from 'react';
import { Sparkles, ArrowLeft, Download, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentStep: 1 | 2 | 3;
  onGoBack: () => void;
  onReset: () => void;
  onOpenExport: () => void;
  hasMedia: boolean;
  onSmartTune: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onGoBack,
  onReset,
  onOpenExport,
  hasMedia,
  onSmartTune,
}) => {
  return (
    <header className="h-16 px-6 border-b border-neutral-800 bg-[#121214] flex items-center justify-between z-30 shrink-0">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        {currentStep === 3 && (
          <button
            onClick={onGoBack}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Voltar para upload"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl tracking-wide text-neutral-100 italic">
            Atelier Retro
          </span>
          <span className="text-xs text-neutral-500 font-sans hidden sm:inline">
            Print & Halftone Studio
          </span>
        </div>
      </div>

      {/* Zone 2: Step milestone indicators */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
        <div
          className={`flex items-center gap-2 ${
            currentStep === 1 ? 'text-amber-400 font-semibold' : 'text-neutral-500'
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] border-current">
            1
          </span>
          <span>Upload de Mídia</span>
        </div>

        <span className="text-neutral-700">·</span>

        <div
          className={`flex items-center gap-2 ${
            currentStep === 2 ? 'text-amber-400 font-semibold' : 'text-neutral-500'
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] border-current">
            2
          </span>
          <span>Processamento Inteligente</span>
        </div>

        <span className="text-neutral-700">·</span>

        <div
          className={`flex items-center gap-2 ${
            currentStep === 3 ? 'text-amber-400 font-semibold' : 'text-neutral-500'
          }`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] border-current">
            3
          </span>
          <span>Studio & Customização</span>
        </div>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        {currentStep === 3 && (
          <>
            <button
              onClick={onSmartTune}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/50 transition-colors whitespace-nowrap"
              title="Recalcular parâmetros ideais com análise óptica"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Auto-Ajuste Inteligente</span>
            </button>

            <button
              onClick={onReset}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Restaurar padrão original"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Salvar & Exportar</span>
            </button>
          </>
        )}

        {currentStep !== 3 && hasMedia && (
          <button
            onClick={onGoBack}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Retomar Edição
          </button>
        )}
      </div>
    </header>
  );
};
