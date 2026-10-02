import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import { LoadedMedia, SmartAnalysisResult } from '../types';
import { PRESETS, VINTAGE_GRADIENT_MAPS } from '../presets';

interface SmartProcessingModalProps {
  media: LoadedMedia;
  analysis: SmartAnalysisResult;
  onComplete: () => void;
}

export const SmartProcessingModal: React.FC<SmartProcessingModalProps> = ({
  media,
  analysis,
  onComplete,
}) => {
  const [stepProgress, setStepProgress] = useState(0);

  const recommendedPreset =
    PRESETS.find((p) => p.id === analysis.recommendedPresetId) || PRESETS[0];
  const recommendedGradient =
    VINTAGE_GRADIENT_MAPS.find((g) => g.id === analysis.recommendedGradientMapId) ||
    VINTAGE_GRADIENT_MAPS[0];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepProgress(1), 250);
    const timer2 = setTimeout(() => setStepProgress(2), 650);
    const timer3 = setTimeout(() => setStepProgress(3), 1100);
    const timer4 = setTimeout(() => onComplete(), 1550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#121214]/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#18181c] border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-neutral-100">
              Calibração Óptica Inteligente
            </h3>
            <p className="text-xs text-neutral-400">
              Analisando {media.type === 'video' ? 'fluxo de vídeo' : 'matriz da imagem'} ({media.width} × {media.height}px)
            </p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-3.5 mb-8">
          <div className="flex items-center gap-3 text-xs">
            {stepProgress >= 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-neutral-600 border-t-amber-400 animate-spin shrink-0" />
            )}
            <span className={stepProgress >= 1 ? 'text-neutral-200' : 'text-neutral-500'}>
              Aferição de contraste (razão: {analysis.contrastRatio}x) e bordas
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {stepProgress >= 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
            )}
            <span className={stepProgress >= 2 ? 'text-neutral-200' : 'text-neutral-500'}>
              Cálculo de frequência de retícula ({analysis.recommendedFrequency} LPI)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {stepProgress >= 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
            )}
            <span className={stepProgress >= 3 ? 'text-neutral-200' : 'text-neutral-500'}>
              Harmonização tonal aplicada: {recommendedPreset.name}
            </span>
          </div>
        </div>

        {/* Highlight Card */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/80 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg shrink-0 border border-white/10 shadow-sm"
              style={{ background: recommendedGradient.previewCss }}
            />
            <div>
              <div className="text-xs font-semibold text-neutral-200">
                {recommendedPreset.name}
              </div>
              <div className="text-[11px] text-neutral-400">
                Paleta: {recommendedGradient.name}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-400 font-mono uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              Otimizado
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors shadow-sm shadow-amber-500/20"
        >
          <span>Abrir Studio com Efeito</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
