import React from 'react';
import { Wand2, ArrowLeft, Download, RotateCcw } from 'lucide-react';

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
    <header className="h-14 px-4 sm:px-6 border-b border-line bg-canvas flex items-center justify-between gap-3 z-30 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {currentStep === 3 && (
          <button
            onClick={onGoBack}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Trocar imagem"
            aria-label="Trocar imagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="font-serif text-2xl italic text-neutral-100 whitespace-nowrap">Atelier Retro</span>
      </div>

      <div className="flex items-center gap-2">
        {currentStep === 3 && (
          <>
            <button
              onClick={onSmartTune}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-neutral-300 rounded-lg hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap"
              title="Recalcular os ajustes a partir da luz e contraste da imagem"
              aria-label="Ajuste automático"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Ajuste automático</span>
            </button>

            <button
              onClick={onReset}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Voltar ao padrão"
              aria-label="Voltar ao padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </>
        )}

        {currentStep !== 3 && hasMedia && (
          <button
            onClick={onGoBack}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Retomar edição
          </button>
        )}
      </div>
    </header>
  );
};
