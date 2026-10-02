import React, { useState } from 'react';
import { EffectParams, GradientMap, LoadedMedia, SmartAnalysisResult } from './types';
import { PRESETS, VINTAGE_GRADIENT_MAPS } from './presets';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { SmartProcessingModal } from './components/SmartProcessingModal';
import { StudioView } from './components/StudioView';
import { analyzeMediaSmartly, applySmartTuneToPreset } from './utils/smartAutoTune';

export default function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [media, setMedia] = useState<LoadedMedia | null>(null);
  const [smartAnalysis, setSmartAnalysis] = useState<SmartAnalysisResult | null>(null);
  const [params, setParams] = useState<EffectParams>(PRESETS[0].params);
  const [currentGradient, setCurrentGradient] = useState<GradientMap>(VINTAGE_GRADIENT_MAPS[0]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Handle media loaded in Step 1
  const handleMediaLoaded = (loadedMedia: LoadedMedia) => {
    setMedia(loadedMedia);

    // Run smart optical analysis (Step 2)
    const analysis = analyzeMediaSmartly(
      loadedMedia.element,
      loadedMedia.width,
      loadedMedia.height
    );
    setSmartAnalysis(analysis);

    // Apply smart tuning values to params & gradient
    const tuned = applySmartTuneToPreset(analysis.recommendedPresetId, analysis);
    setParams(tuned.params);
    setCurrentGradient(tuned.gradient);

    // Show Smart Processing modal briefly
    setCurrentStep(2);
  };

  // Complete Step 2 and enter Studio (Step 3)
  const handleSmartProcessingComplete = () => {
    setCurrentStep(3);
  };

  // Re-run smart tune on demand in Step 3
  const handleReSmartTune = () => {
    if (!media) return;
    const analysis = analyzeMediaSmartly(media.element, media.width, media.height);
    setSmartAnalysis(analysis);
    const tuned = applySmartTuneToPreset(analysis.recommendedPresetId, analysis);
    setParams(tuned.params);
    setCurrentGradient(tuned.gradient);
  };

  // Reset to default preset
  const handleReset = () => {
    const defaultPreset = PRESETS[0];
    setParams(defaultPreset.params);
    const defaultGrad =
      VINTAGE_GRADIENT_MAPS.find((g) => g.id === defaultPreset.params.gradientMapId) ||
      VINTAGE_GRADIENT_MAPS[0];
    setCurrentGradient(defaultGrad);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-neutral-100 flex flex-col antialiased selection:bg-amber-400 selection:text-neutral-950 font-sans">
      {/* Top Bar Contract compliant Header */}
      <Header
        currentStep={currentStep}
        onGoBack={() => setCurrentStep(1)}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        hasMedia={media !== null}
        onSmartTune={handleReSmartTune}
      />

      {/* Main Journey Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Step 1: Upload & Input */}
        {currentStep === 1 && (
          <div className="flex-1 overflow-y-auto flex items-center justify-center">
            <UploadDropzone onMediaLoaded={handleMediaLoaded} />
          </div>
        )}

        {/* Step 2: Smart Processing Modal (Overlay) */}
        {currentStep === 2 && media && smartAnalysis && (
          <div className="flex-1 flex items-center justify-center">
            <SmartProcessingModal
              media={media}
              analysis={smartAnalysis}
              onComplete={handleSmartProcessingComplete}
            />
          </div>
        )}

        {/* Step 3: Studio & Final Real-Time View */}
        {currentStep === 3 && media && (
          <StudioView
            media={media}
            initialParams={params}
            initialGradient={currentGradient}
            onSmartTune={handleReSmartTune}
            onBackToUpload={() => setCurrentStep(1)}
            isExportOpen={isExportOpen}
            setIsExportOpen={setIsExportOpen}
          />
        )}
      </main>
    </div>
  );
}
