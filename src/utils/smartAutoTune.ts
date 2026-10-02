import { PRESETS, VINTAGE_GRADIENT_MAPS } from '../presets';
import { SmartAnalysisResult } from '../types';

export function analyzeMediaSmartly(
  mediaElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  width: number,
  height: number
): SmartAnalysisResult {
  const sampleCanvas = document.createElement('canvas');
  const sampleSize = 120;
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const ctx = sampleCanvas.getContext('2d');

  if (!ctx) {
    return {
      avgLuminance: 0.5,
      contrastRatio: 1.2,
      edgeDensity: 0.4,
      recommendedFrequency: 68,
      recommendedThreshold: 0.5,
      recommendedBleed: 0.22,
      recommendedPresetId: 'wavy_engraving_studio',
      recommendedGradientMapId: 'lilac_charcoal',
    };
  }

  // Draw media downscaled
  try {
    ctx.drawImage(mediaElement, 0, 0, sampleSize, sampleSize);
  } catch {
    // Canvas security or video frame not ready fallback
  }

  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imageData.data;
  const totalPixels = sampleSize * sampleSize;

  let totalLuma = 0;
  let totalRed = 0;
  let totalBlue = 0;
  const lumaValues: number[] = new Float32Array(totalPixels) as unknown as number[];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuma += luma;
    totalRed += r;
    totalBlue += b;
    lumaValues[i / 4] = luma;
  }

  const avgLuma = totalLuma / totalPixels;

  // Calculate Variance / Contrast
  let variance = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = lumaValues[i] - avgLuma;
    variance += diff * diff;
  }
  const stdDev = Math.sqrt(variance / totalPixels);

  // Fast Sobel Edge estimation
  let edgeSum = 0;
  for (let y = 1; y < sampleSize - 1; y += 2) {
    for (let x = 1; x < sampleSize - 1; x += 2) {
      const idx = y * sampleSize + x;
      const gx =
        lumaValues[idx + 1] -
        lumaValues[idx - 1] +
        2 * (lumaValues[idx + sampleSize + 1] - lumaValues[idx + sampleSize - 1]);
      const gy =
        lumaValues[idx + sampleSize] -
        lumaValues[idx - sampleSize] +
        2 * (lumaValues[idx + sampleSize + 1] - lumaValues[idx - sampleSize + 1]);
      edgeSum += Math.abs(gx) + Math.abs(gy);
    }
  }
  const edgeDensity = edgeSum / ((sampleSize / 2) * (sampleSize / 2));

  // Determine optimal resolution-relative frequency
  const minDim = Math.min(width, height);
  // Scale between 50 and 85 based on dimensions and edge density
  const baseFreq = minDim > 1200 ? 75 : (minDim > 700 ? 65 : 55);
  const recommendedFrequency = Math.round(baseFreq * (edgeDensity > 0.5 ? 1.15 : 0.95));

  // Optimal threshold: compensate if image is too dark or too bright
  let recommendedThreshold = 0.5;
  if (avgLuma < 0.35) {
    // Dark image: lower threshold slightly to open up midtones
    recommendedThreshold = 0.42;
  } else if (avgLuma > 0.65) {
    // Bright image: raise threshold to retain punchy shadow ink
    recommendedThreshold = 0.56;
  }

  // Ink bleed based on contrast and brightness
  const recommendedBleed = stdDev > 0.28 ? 0.18 : 0.28;

  // Pick best preset & gradient map
  let recommendedPresetId = 'wavy_engraving_studio';
  let recommendedGradientMapId = 'lilac_charcoal';

  if (edgeDensity > 0.55) {
    recommendedPresetId = 'wavy_engraving_studio'; // Linhas onduladas de gravura funcionam espetacularmente com retratos detalhados
    recommendedGradientMapId = 'lilac_charcoal';
  } else if (stdDev > 0.3) {
    recommendedPresetId = 'pop_art_screenprint';
    recommendedGradientMapId = 'mustard_navy';
  } else if (avgLuma < 0.3) {
    recommendedPresetId = 'xerox_grunge_fanzine';
    recommendedGradientMapId = 'classic_fanzine_bw';
  } else {
    recommendedPresetId = 'risograph_drum_print';
    recommendedGradientMapId = 'riso_coral_indigo';
  }

  return {
    avgLuminance: Number(avgLuma.toFixed(2)),
    contrastRatio: Number((stdDev * 3.5).toFixed(2)),
    edgeDensity: Number(edgeDensity.toFixed(2)),
    recommendedFrequency,
    recommendedThreshold,
    recommendedBleed,
    recommendedPresetId,
    recommendedGradientMapId,
  };
}

export function applySmartTuneToPreset(
  presetId: string,
  analysis: SmartAnalysisResult
) {
  const basePreset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const chosenGradient =
    VINTAGE_GRADIENT_MAPS.find((g) => g.id === analysis.recommendedGradientMapId) ||
    VINTAGE_GRADIENT_MAPS[0];

  const params = { ...basePreset.params };
  params.frequency = analysis.recommendedFrequency;
  params.threshold = analysis.recommendedThreshold;
  params.inkBleed = analysis.recommendedBleed;
  params.gradientMapId = chosenGradient.id;
  params.customColors = {
    shadow: chosenGradient.colors[0],
    midtone: chosenGradient.colors.length === 3 ? chosenGradient.colors[1] : undefined,
    highlight: chosenGradient.colors[chosenGradient.colors.length - 1],
  };

  return {
    preset: basePreset,
    gradient: chosenGradient,
    params,
  };
}
