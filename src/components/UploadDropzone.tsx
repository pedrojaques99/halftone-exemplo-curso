import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Video, Camera, Sparkles, Play, Film } from 'lucide-react';
import { LoadedMedia } from '../types';
import { createSamplePortraitCanvas, createSampleRisoArtCanvas, LiveMotionCanvasGenerator } from '../utils/sampleMedia';

interface UploadDropzoneProps {
  onMediaLoaded: (media: LoadedMedia) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onMediaLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
      {/* Title */}
      <div className="text-center max-w-xl mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-neutral-100 tracking-tight mb-3">
          Estúdio de Retícula & Arte Vintage
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed font-sans">
          Efeitos analógicos de xilogravura, risografia, gravura em linhas onduladas e halftone em tempo real.
          Processamento GPU com suporte a imagens estáticas e vídeos em alta taxa de quadros.
        </p>
      </div>

      {/* Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full relative border-2 border-dashed rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-950/20 scale-[1.01]'
            : 'border-neutral-800 bg-[#161619] hover:border-neutral-700 hover:bg-[#1a1a1e]'
        }`}
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

        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-5 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-neutral-100 mb-1">
          Arraste e solte sua imagem ou vídeo aqui
        </h3>
        <p className="text-xs text-neutral-400 mb-6 text-center">
          Formatos suportados: PNG, JPG, WebP, GIF, MP4, WebM (ou pressione Ctrl+V para colar)
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-200 hover:bg-white text-neutral-950 text-xs font-semibold transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Selecionar do Computador</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startWebcam();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700/80 transition-colors"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Usar WebCam ao Vivo</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 px-4 py-2 bg-red-950/60 border border-red-800/80 text-red-300 text-xs rounded-lg">
            {errorMessage}
          </div>
        )}
      </div>

      {/* 1-Click Sample Gallery */}
      <div className="w-full mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Ou experimente com uma amostra instantânea
            </h2>
          </div>
          <span className="text-xs text-neutral-500 hidden sm:inline">1 clique para iniciar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sample 1: Portrait */}
          <button
            type="button"
            onClick={loadSamplePortrait}
            className="group p-3 rounded-xl bg-[#161619] border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900 transition-all text-left flex items-start gap-3"
          >
            <div className="w-14 h-14 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-neutral-700 text-neutral-400 group-hover:text-amber-400 transition-colors">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors">
                Retrato Editorial
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                Linhas de xilogravura, hachuras e halftone de alto contraste.
              </div>
            </div>
          </button>

          {/* Sample 2: Riso Poster */}
          <button
            type="button"
            onClick={loadSampleRisoArt}
            className="group p-3 rounded-xl bg-[#161619] border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900 transition-all text-left flex items-start gap-3"
          >
            <div className="w-14 h-14 rounded-lg bg-amber-400/20 overflow-hidden shrink-0 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors">
                Arte Pop & Risografia
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                Deslocamento de chapas mecânicas, cores puras e papel vintage.
              </div>
            </div>
          </button>

          {/* Sample 3: 60fps Motion */}
          <button
            type="button"
            onClick={loadSampleMotion}
            className="group p-3 rounded-xl bg-[#161619] border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900 transition-all text-left flex items-start gap-3"
          >
            <div className="w-14 h-14 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center border border-neutral-700 text-neutral-400 group-hover:text-amber-400 transition-colors">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                <span>Motion Loop 60 FPS</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">VÍDEO</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                Anéis ópticos e tipografia cinética em tempo real com baixa latência.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Feature Pills / Info */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500 mt-10">
        <span className="flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-neutral-400" />
          WebGL 60+ FPS em Tempo Real
        </span>
        <span aria-hidden="true">·</span>
        <span>20+ Gradient Maps Vintage</span>
        <span aria-hidden="true">·</span>
        <span>Exportação PNG / WebP / MP4</span>
      </div>
    </div>
  );
};
