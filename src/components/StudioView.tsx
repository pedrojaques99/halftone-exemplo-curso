import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Palette,
  Sparkles,
  Download,
  Copy,
  Check,
  SplitSquareVertical,
  Maximize2,
  Minimize2,
  RefreshCw,
  Video as VideoIcon,
  Circle,
  Eye,
  Settings2,
} from 'lucide-react';
import { EffectParams, GradientMap, LoadedMedia, PatternType, Preset } from '../types';
import { PRESETS, VINTAGE_GRADIENT_MAPS } from '../presets';
import { WebGLRetroPipeline } from '../engine/webglPipeline';

interface StudioViewProps {
  media: LoadedMedia;
  initialParams: EffectParams;
  initialGradient: GradientMap;
  onSmartTune: () => void;
  onBackToUpload: () => void;
  isExportOpen: boolean;
  setIsExportOpen: (open: boolean) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  media,
  initialParams,
  initialGradient,
  onSmartTune,
  onBackToUpload,
  isExportOpen,
  setIsExportOpen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<WebGLRetroPipeline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Studio State
  const [params, setParams] = useState<EffectParams>(initialParams);
  const [currentGradient, setCurrentGradient] = useState<GradientMap>(initialGradient);
  const [activeTab, setActiveTab] = useState<'presets' | 'gradients' | 'params'>('presets');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);

  // Viewport state
  const [fps, setFps] = useState(60);
  const [showSplit, setShowSplit] = useState(false);
  const [splitPos, setSplitPos] = useState(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [zoomFit, setZoomFit] = useState(true);

  // Export state
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Update pipeline config whenever params or gradient change
  const syncPipeline = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.updateConfig(params, currentGradient, splitPos, showSplit);
    }
  }, [params, currentGradient, splitPos, showSplit]);

  useEffect(() => {
    syncPipeline();
  }, [syncPipeline]);

  // Initialize WebGL pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions according to media aspect ratio
    const width = media.width;
    const height = media.height;
    canvas.width = width;
    canvas.height = height;

    const pipeline = new WebGLRetroPipeline(canvas, (newFps) => {
      setFps(newFps);
    });
    pipelineRef.current = pipeline;

    pipeline.setMediaSource(media.element, media.type === 'video');
    pipeline.updateConfig(params, currentGradient, splitPos, showSplit);

    return () => {
      pipeline.destroy();
      pipelineRef.current = null;
    };
  }, [media]);

  // Video time tracking
  useEffect(() => {
    if (media.type !== 'video') return;
    const video = media.element as HTMLVideoElement;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && !duration) setDuration(video.duration);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [media, duration]);

  // Handle Video Play / Pause
  const togglePlayPause = () => {
    if (media.type !== 'video') return;
    const video = media.element as HTMLVideoElement;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      pipelineRef.current?.startRenderLoop();
    } else {
      video.pause();
      setIsPlaying(false);
      pipelineRef.current?.stopRenderLoop();
    }
  };

  const handleSeek = (newTime: number) => {
    if (media.type !== 'video') return;
    const video = media.element as HTMLVideoElement;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Split-Screen Drag Handling
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    setSplitPos(x);
  };

  // Apply Preset
  const handleSelectPreset = (preset: Preset) => {
    const newParams = { ...preset.params };
    setParams(newParams);

    const gradient =
      VINTAGE_GRADIENT_MAPS.find((g) => g.id === preset.params.gradientMapId) || currentGradient;
    setCurrentGradient(gradient);
  };

  // Apply Gradient Map
  const handleSelectGradient = (grad: GradientMap) => {
    setCurrentGradient(grad);
    setParams((prev) => ({
      ...prev,
      colorMode: 'gradient_map',
      gradientMapId: grad.id,
      customColors: {
        shadow: grad.colors[0],
        midtone: grad.colors.length === 3 ? grad.colors[1] : undefined,
        highlight: grad.colors[grad.colors.length - 1],
      },
    }));
  };

  // Save Image
  const handleDownloadImage = () => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    const dataUrl = pipeline.exportHighResolution(media.width, media.height);
    const link = document.createElement('a');
    link.download = `vintage_${media.fileName.replace(/\.[^/.]+$/, '')}_${params.patternType}.${exportFormat}`;
    link.href = dataUrl;
    link.click();
    setIsExportOpen(false);
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    const pipeline = pipelineRef.current;
    if (!pipeline) return;

    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = media.width;
      offscreen.height = media.height;
      const tempPipeline = new WebGLRetroPipeline(offscreen);
      tempPipeline.setMediaSource(media.element, false);
      tempPipeline.updateConfig(params, currentGradient, 0.5, false);
      tempPipeline.render();

      offscreen.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
      tempPipeline.destroy();
    } catch {
      // Fallback
    }
  };

  // Record Video Clip
  const handleRecordVideoClip = () => {
    if (!canvasRef.current || isRecording) return;
    try {
      const stream = canvasRef.current.captureStream(60);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vintage_motion_${Date.now()}.webm`;
        a.click();
        setIsRecording(false);
        setRecordProgress(0);
      };

      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;

      // Record for 4 seconds loop
      let sec = 0;
      const interval = setInterval(() => {
        sec += 0.5;
        setRecordProgress(Math.min(100, Math.round((sec / 4) * 100)));
        if (sec >= 4) {
          clearInterval(interval);
          if (recorder.state === 'recording') recorder.stop();
        }
      }, 500);
    } catch (e) {
      console.error('Erro gravando vídeo:', e);
      setIsRecording(false);
    }
  };

  const filteredGradients =
    activeCategory === 'all'
      ? VINTAGE_GRADIENT_MAPS
      : VINTAGE_GRADIENT_MAPS.filter((g) => g.category === activeCategory);

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
      {/* Main Viewport */}
      <div className="flex-1 flex flex-col bg-[#0e0e10] overflow-hidden select-none">
        {/* Top Viewport Toolbar */}
        <div className="h-11 px-4 border-b border-neutral-800/80 bg-[#141417] flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 font-medium truncate max-w-[200px]">
              {media.fileName}
            </span>
            <span className="text-neutral-700">·</span>
            <span className="text-[11px] text-neutral-500 font-mono">
              {media.width} × {media.height}
            </span>
            <span className="text-neutral-700">·</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono uppercase font-semibold">
              {media.type === 'video' ? 'VÍDEO 60FPS' : 'IMAGEM'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Split Screen Toggle */}
            <button
              onClick={() => setShowSplit(!showSplit)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                showSplit
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Comparar Antes / Depois"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Antes / Depois</span>
            </button>

            {/* Invert Toggle */}
            <button
              onClick={() => setParams((p) => ({ ...p, invert: !p.invert }))}
              className={`p-1.5 rounded text-xs transition-colors ${
                params.invert
                  ? 'bg-neutral-200 text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Inverter luzes e sombras"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Fit Zoom */}
            <button
              onClick={() => setZoomFit(!zoomFit)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title={zoomFit ? 'Visualizar 100%' : 'Ajustar à janela'}
            >
              {zoomFit ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* FPS Badge */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{fps} FPS</span>
            </div>
          </div>
        </div>

        {/* Viewport Canvas Center */}
        <div
          ref={containerRef}
          onMouseMove={handleSplitMouseMove}
          onMouseUp={() => setIsDraggingSplit(false)}
          className="flex-1 overflow-hidden relative flex items-center justify-center p-4"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div
            className={`relative max-w-full max-h-full transition-transform flex items-center justify-center ${
              zoomFit ? 'w-auto h-auto' : 'overflow-auto'
            }`}
          >
            <canvas
              ref={canvasRef}
              className="shadow-2xl rounded-sm max-w-full max-h-[calc(100vh-190px)] object-contain"
            />

            {/* Split Screen Slider Handle */}
            {showSplit && (
              <div
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center group"
                style={{ left: `${splitPos * 100}%` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingSplit(true);
                }}
              >
                <div className="w-0.5 h-full bg-amber-400 shadow-md group-hover:w-1 transition-all" />
                <div className="w-7 h-7 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[10px] font-bold shadow-lg border border-black/20 group-hover:scale-110 transition-transform">
                  ⇄
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Scrubber Controls (if video) */}
        {media.type === 'video' && (
          <div className="h-14 px-6 border-t border-neutral-800 bg-[#141417] flex items-center gap-4 z-10 shrink-0">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <span className="text-xs font-mono text-neutral-400 w-12">
              {currentTime.toFixed(1)}s
            </span>

            <input
              type="range"
              min={0}
              max={duration || 10}
              step={0.05}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            <span className="text-xs font-mono text-neutral-500 w-12 text-right">
              {(duration || 0).toFixed(1)}s
            </span>

            {/* Quick Record Motion Clip */}
            <button
              onClick={handleRecordVideoClip}
              disabled={isRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
              title="Gravar clipe WebM em tempo real"
            >
              <Circle className={`w-3 h-3 ${isRecording ? 'fill-red-500' : 'fill-current'}`} />
              <span>{isRecording ? `Gravando (${recordProgress}%)` : 'Gravar Clipe'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Panel Drawer */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 bg-[#161619] flex flex-col z-20 shrink-0 h-[380px] lg:h-auto overflow-hidden">
        {/* Panel Tabs */}
        <div className="h-12 border-b border-neutral-800 px-4 flex items-center gap-1 bg-[#18181c] shrink-0">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors text-center ${
              activeTab === 'presets'
                ? 'bg-neutral-800 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('gradients')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors text-center ${
              activeTab === 'gradients'
                ? 'bg-neutral-800 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Gradient Maps
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors text-center ${
              activeTab === 'params'
                ? 'bg-neutral-800 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Ajustes Finos
          </button>
        </div>

        {/* Panel Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                Estilos Clássicos de Impressão Vintage
              </div>

              {PRESETS.map((preset) => {
                const isSelected = params.patternType === preset.params.patternType;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/20 shadow-sm'
                        : 'border-neutral-800/80 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                        <span>{preset.name}</span>
                        {preset.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-neutral-950 font-bold uppercase">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {preset.subtitle}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 leading-tight">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: GRADIENT MAPS */}
          {activeTab === 'gradients' && (
            <div className="space-y-4">
              {/* Category Segmented Control */}
              <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg text-[11px]">
                {['all', 'duotone', 'tritone', 'monochrome'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 py-1 rounded capitalize transition-colors ${
                      activeCategory === cat
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Todos'
                      : cat === 'duotone'
                      ? 'Duotone'
                      : cat === 'tritone'
                      ? 'Tritone'
                      : 'Mono'}
                  </button>
                ))}
              </div>

              {/* Grid of Vintage Gradient Maps */}
              <div className="grid grid-cols-2 gap-2">
                {filteredGradients.map((grad) => {
                  const isSelected = currentGradient.id === grad.id;
                  return (
                    <button
                      key={grad.id}
                      onClick={() => handleSelectGradient(grad)}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/20 shadow-sm ring-1 ring-amber-400/50'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-lg shadow-inner border border-white/10"
                        style={{ background: grad.previewCss }}
                      />
                      <div className="text-[11px] font-medium text-neutral-200 truncate">
                        {grad.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Pickers */}
              <div className="pt-4 border-t border-neutral-800/80 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Personalizar Cores de Tinta
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <input
                      type="color"
                      value={params.customColors.shadow}
                      onChange={(e) =>
                        setParams((p) => ({
                          ...p,
                          colorMode: 'duotone_custom',
                          customColors: { ...p.customColors, shadow: e.target.value },
                        }))
                      }
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[11px] text-neutral-300">Tinta Escura</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2 bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <input
                      type="color"
                      value={params.customColors.highlight}
                      onChange={(e) =>
                        setParams((p) => ({
                          ...p,
                          colorMode: 'duotone_custom',
                          customColors: { ...p.customColors, highlight: e.target.value },
                        }))
                      }
                      className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-[11px] text-neutral-300">Base do Papel</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINE-TUNING PARAMETERS */}
          {activeTab === 'params' && (
            <div className="space-y-4">
              {/* Pattern Type Selector */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block mb-2">
                  Tipo de Matriz / Retícula
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'wavy_engraving', label: 'Gravura em Linhas' },
                    { id: 'halftone_dots', label: 'Pontos Halftone' },
                    { id: 'risograph_stipple', label: 'Risografia Stipple' },
                    { id: 'xerox_grunge', label: 'Xerox Fanzine' },
                    { id: 'concentric_waves', label: 'Ondas Concêntricas' },
                    { id: 'crosshatch', label: 'Hachura Cruzada' },
                    { id: 'cmyk_rosette', label: 'Roseta CMYK' },
                  ].map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() =>
                        setParams((p) => ({ ...p, patternType: pat.id as PatternType }))
                      }
                      className={`py-1.5 px-2.5 rounded-lg text-left truncate transition-colors ${
                        params.patternType === pat.id
                          ? 'bg-amber-400 text-neutral-950 font-semibold'
                          : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {pat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                {/* Frequency */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Frequência / Densidade</span>
                    <span className="font-mono text-neutral-500">{params.frequency} LPI</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    value={params.frequency}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, frequency: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Angle */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Ângulo de Retícula</span>
                    <span className="font-mono text-neutral-500">{params.angle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={params.angle}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, angle: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Contraste Tonal</span>
                    <span className="font-mono text-neutral-500">{params.contrast.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.4}
                    step={0.05}
                    value={params.contrast}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, contrast: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Threshold */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Ponto de Corte (Threshold)</span>
                    <span className="font-mono text-neutral-500">{params.threshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.02}
                    value={params.threshold}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, threshold: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Ink Bleed */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Sangria & Espalhamento de Tinta</span>
                    <span className="font-mono text-neutral-500">
                      {Math.round(params.inkBleed * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.02}
                    value={params.inkBleed}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, inkBleed: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Misregistration */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Deslocamento de Chapa (Misregistration)</span>
                    <span className="font-mono text-neutral-500">{params.misregistration}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.2}
                    value={params.misregistration}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, misregistration: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Paper Grain */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Fibras e Grão de Celulose</span>
                    <span className="font-mono text-neutral-500">
                      {Math.round(params.paperGrain * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.paperGrain}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, paperGrain: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Xerox Grit */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Poeira & Grão de Toner Xerox</span>
                    <span className="font-mono text-neutral-500">
                      {Math.round(params.xeroxGrit * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.xeroxGrit}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, xeroxGrit: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Wavy Line Engraving specific controls */}
                {params.patternType === 'wavy_engraving' && (
                  <>
                    <div>
                      <div className="flex justify-between text-xs text-neutral-300 mb-1">
                        <span>Amplitude da Onda de Gravura</span>
                        <span className="font-mono text-neutral-500">
                          {params.waveAmplitude.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1.5}
                        step={0.05}
                        value={params.waveAmplitude}
                        onChange={(e) =>
                          setParams((p) => ({ ...p, waveAmplitude: parseFloat(e.target.value) }))
                        }
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export / Save Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#18181c] border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif text-2xl text-neutral-100 mb-2">
              Salvar Arte Final
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Exportação em alta fidelidade com resolução de matriz integral ({media.width} × {media.height}px).
            </p>

            <div className="space-y-4 mb-6">
              {/* Format selection */}
              <div>
                <label className="text-xs text-neutral-300 block mb-2 font-medium">
                  Formato de Exportação
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`py-2 rounded-lg font-medium uppercase transition-colors ${
                        exportFormat === fmt
                          ? 'bg-amber-400 text-neutral-950 font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadImage}
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Imagem em Alta Resolução</span>
                </button>

                <button
                  onClick={handleCopyToClipboard}
                  className="w-full py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-neutral-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Imagem'}</span>
                </button>

                {media.type === 'video' && (
                  <button
                    onClick={handleRecordVideoClip}
                    disabled={isRecording}
                    className="w-full py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-amber-800/40"
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>{isRecording ? `Gravando (${recordProgress}%)` : 'Exportar Clipe de Vídeo (WebM)'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsExportOpen(false)}
              className="w-full py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
