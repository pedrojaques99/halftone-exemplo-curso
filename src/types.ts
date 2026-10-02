export type PatternType = 
  | 'halftone_dots'      // Pontos circulares clássicos 45°
  | 'wavy_engraving'     // Linhas onduladas de gravura em madeira (como na ref do usuário)
  | 'concentric_waves'   // Gravura concêntrica radial
  | 'risograph_stipple'  // Separação de canais de risografia com micro-stipple
  | 'xerox_grunge'       // Toner granulado de fotocopiadora vintage
  | 'cmyk_rosette'       // Roseta quadricromia de gibi / quadrinhos antigos
  | 'crosshatch';        // Hachura cruzada de bico de pena

export interface GradientMap {
  id: string;
  name: string;
  category: 'duotone' | 'tritone' | 'riso' | 'monochrome';
  colors: string[]; // [shadows, (midtones), highlights] in hex
  previewCss: string;
}

export interface EffectParams {
  patternType: PatternType;
  frequency: number;       // Densidade dos pontos / linhas (10 a 250)
  angle: number;           // Ângulo em graus (0 a 180)
  contrast: number;        // Contraste (0.5 a 2.5)
  threshold: number;       // Ponto de corte de luz (0.0 a 1.0)
  inkBleed: number;        // Sangria e espalhamento da tinta no papel (0.0 a 1.0)
  misregistration: number; // Deslocamento de cor das matrizes de impressão (0.0 a 10.0 px)
  paperGrain: number;      // Textura e fibras do papel analógico (0.0 a 1.0)
  xeroxGrit: number;        // Sujeira e grão áspero de fanzine / xerox (0.0 a 1.0)
  waveFrequency: number;   // Frequência das ondas na gravura (0.0 a 5.0)
  waveAmplitude: number;   // Amplitude da ondulação das linhas (0.0 a 1.0)
  colorMode: 'gradient_map' | 'original_cmyk' | 'duotone_custom';
  gradientMapId: string;
  customColors: {
    shadow: string;
    midtone?: string;
    highlight: string;
  };
  invert: boolean;
}

export interface Preset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge?: string;
  params: EffectParams;
}

export type MediaSourceType = 'image' | 'video' | 'webcam' | 'sample';

export interface LoadedMedia {
  type: 'image' | 'video';
  element: HTMLImageElement | HTMLVideoElement;
  width: number;
  height: number;
  aspectRatio: number;
  fileName: string;
  duration?: number;
  isSample?: boolean;
}

export interface SmartAnalysisResult {
  avgLuminance: number;
  contrastRatio: number;
  edgeDensity: number;
  recommendedFrequency: number;
  recommendedThreshold: number;
  recommendedBleed: number;
  recommendedPresetId: string;
  recommendedGradientMapId: string;
}
