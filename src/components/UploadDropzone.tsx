import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Camera, Play } from 'lucide-react';
import { LoadedMedia } from '../types';
import { createSamplePortraitCanvas, createSampleRisoArtCanvas, LiveMotionCanvasGenerator } from '../utils/sampleMedia';
import { renderEffectThumbs } from '../utils/effectThumbs';
import { PRESETS } from '../presets';

const presetParams = (id: string) => (PRESETS.find((p) => p.id === id) ?? PRESETS[0]).params;

type ThumbKey = 'hero' | 'portrait' | 'riso' | 'motion';

interface UploadDropzoneProps {
  onMediaLoaded: (media: LoadedMedia) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onMediaLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Partial<Record<ThumbKey, string>>>({});

  // Prova antes de pedir: as amostras renderizadas pelo próprio shader
  useEffect(() => {
    const portrait = createSamplePortraitCanvas();
    const riso = createSampleRisoArtCanvas();
    const [hero] = renderEffectThumbs(portrait, portrait.width, portrait.height, [presetParams('pop_art_screenprint')], {
      maxSide: 840,
      split: 0.5,
    });
    const [portraitThumb] = renderEffectThumbs(portrait, portrait.width, portrait.height, [presetParams('wavy_engraving_studio')], { maxSide: 160 });
    const [risoThumb] = renderEffectThumbs(riso, riso.width, riso.height, [presetParams('risograph_drum_print')], { maxSide: 160 });
    setThumbs({ hero, portrait: portraitThumb, riso: risoThumb });

    const motion = new LiveMotionCanvasGenerator(400, 400);
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const [m] = renderEffectThumbs(motion.canvas, 400, 400, [presetParams('concentric_optical_lines')], { maxSide: 160 });
        motion.stop();
        setThumbs((t) => ({ ...t, motion: m }));
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      motion.stop();
    };
  }, []);

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setErrorMessage('Por favor selecione um arquivo de imagem (PNG, JPG, WebP) ou vídeo (MP4, WebM).');
      return;
    }

    const url = URL.createObjectURL(file);

    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.play().catch(() => {});
        onMediaLoaded({
          type: 'video',
          element: video,
          width: video.videoWidth || 1280,
          height: video.videoHeight || 720,
          aspectRatio: (video.videoWidth || 1280) / (video.videoHeight || 720),
          fileName: file.name,
          duration: video.duration,
        });
      };

      video.onerror = () => {
        setErrorMessage('Não foi possível carregar o vídeo. Verifique o formato.');
      };
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      img.onload = () => {
        onMediaLoaded({
          type: 'image',
          element: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
          fileName: file.name,
        });
      };

      img.onerror = () => {
        setErrorMessage('Não foi possível carregar a imagem. Tente outro arquivo.');
      };
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Sample Loaders
  const loadSamplePortrait = () => {
    const canvas = createSamplePortraitCanvas();
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => {
      onMediaLoaded({
        type: 'image',
        element: img,
        width: canvas.width,
        height: canvas.height,
        aspectRatio: canvas.width / canvas.height,
        fileName: 'retrato_vintage_editorial.png',
        isSample: true,
      });
    };
  };

  const loadSampleRisoArt = () => {
    const canvas = createSampleRisoArtCanvas();
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => {
      onMediaLoaded({
        type: 'image',
        element: img,
        width: canvas.width,
        height: canvas.height,
        aspectRatio: canvas.width / canvas.height,
        fileName: 'ilustracao_riso_pantera.png',
        isSample: true,
      });
    };
  };

  const loadSampleMotion = () => {
    // Generate a live 60fps motion canvas stream
    const motionGen = new LiveMotionCanvasGenerator(800, 800);
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    // Use captureStream from canvas
    const stream = motionGen.canvas.captureStream(60);
    video.srcObject = stream;
    video.play().then(() => {
      onMediaLoaded({
        type: 'video',
        element: video,
        width: 800,
        height: 800,
        aspectRatio: 1.0,
        fileName: 'motion_loop_60fps.webm',
        duration: 9999,
        isSample: true,
      });
    });
  };

  const startWebcam = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } },
        audio: false,
      });
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      video.play().then(() => {
        onMediaLoaded({
          type: 'video',
          element: video,
          width: 1280,
          height: 720,
          aspectRatio: 16 / 9,
          fileName: 'camera_ao_vivo.stream',
        });
      });
    } catch {
      setErrorMessage('Não foi possível acessar a webcam. Verifique as permissões do navegador.');
    }
  };

  const samples: { key: ThumbKey; name: string; line: string; onClick: () => void; video?: boolean }[] = [
    { key: 'portrait', name: 'Retrato editorial', line: 'Xilogravura em linhas onduladas', onClick: loadSamplePortrait },
    { key: 'riso', name: 'Pôster risográfico', line: 'Chapas deslocadas, papel quente', onClick: loadSampleRisoArt },
    { key: 'motion', name: 'Loop em movimento', line: 'Vídeo processado quadro a quadro', onClick: loadSampleMotion, video: true },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {isDragging && (
        <div className="pointer-events-none absolute inset-2 z-20 rounded-2xl border border-dashed border-amber-400 bg-amber-950/30 flex items-center justify-center">
          <span className="text-sm font-semibold text-amber-300">Solte pra abrir no estúdio</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center lg:gap-14">
        {/* Promessa + ação */}
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-4xl sm:text-6xl leading-[1.02] text-neutral-100">
              Sua imagem em retícula, em tempo real.
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-md mx-auto lg:mx-0">
              Halftone, risografia, xilogravura e xerox direto no navegador. Funciona com foto, vídeo e webcam.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Também dá pra arrastar o arquivo pra página ou colar com Ctrl+V"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-sm font-semibold transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Escolher imagem ou vídeo</span>
              </button>
              <button
                type="button"
                onClick={startWebcam}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Usar webcam</span>
              </button>
            </div>
            {errorMessage && (
              <div role="alert" className="px-4 py-2 bg-red-950/60 text-red-300 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Prova: o próprio motor, antes e depois */}
        <button
          type="button"
          onClick={loadSamplePortrait}
          className="group relative order-first lg:order-none mx-auto w-full max-w-[420px] aspect-[5/6] rounded-xl overflow-hidden bg-surface border border-line hover:border-amber-400/60 transition-colors"
          title="Abrir esta amostra no estúdio"
        >
          {thumbs.hero ? (
            <img src={thumbs.hero} alt="Retrato antes e depois do efeito de retícula" className="w-full h-full object-cover" onError={() => setThumbs((t) => ({ ...t, hero: undefined }))} />
          ) : (
            <div className="w-full h-full animate-pulse bg-surface-hover" />
          )}
          <span className="absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded bg-canvas/80 text-neutral-300">Antes</span>
          <span className="absolute top-3 right-3 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-400 text-neutral-950">Depois</span>
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-24px)] text-xs font-medium px-3 py-1 rounded-full bg-canvas/85 text-neutral-200 group-hover:text-amber-300 transition-colors">
            Abrir no estúdio
          </span>
        </button>
      </div>

      {/* Amostras: cada uma mostra o efeito que abre */}
      <div className="mt-14">
        <h2 className="text-sm font-medium text-neutral-400 mb-4 text-center lg:text-left">Ou comece por uma amostra</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {samples.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={s.onClick}
              className="group flex items-center gap-3 p-2 pr-3 rounded-xl bg-surface hover:bg-surface-hover border border-line hover:border-amber-400/50 transition-colors text-left"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-raised">
                {thumbs[s.key] && <img src={thumbs[s.key]} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                {s.video && (
                  <Play className="absolute bottom-1 right-1 w-3.5 h-3.5 text-white fill-current drop-shadow" aria-label="vídeo" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors">{s.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5 truncate">{s.line}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
