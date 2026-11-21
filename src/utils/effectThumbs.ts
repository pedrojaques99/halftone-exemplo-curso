import { EffectParams, GradientMap } from '../types';
import { VINTAGE_GRADIENT_MAPS } from '../presets';
import { WebGLRetroPipeline } from '../engine/webglPipeline';

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export const gradientFor = (params: EffectParams): GradientMap =>
  VINTAGE_GRADIENT_MAPS.find((g) => g.id === params.gradientMapId) ?? VINTAGE_GRADIENT_MAPS[0];

/**
 * Renderiza o efeito real (o mesmo shader do Studio) sobre uma fonte, em várias
 * configurações, num único contexto WebGL. Devolve dataURLs na mesma ordem.
 * `split` liga o antes/depois do próprio shader.
 */
export function renderEffectThumbs(
  source: Source,
  sourceWidth: number,
  sourceHeight: number,
  configs: EffectParams[],
  opts: { maxSide?: number; split?: number } = {}
): string[] {
  const maxSide = opts.maxSide ?? 240;
  const scale = maxSide / Math.max(sourceWidth, sourceHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const pipeline = new WebGLRetroPipeline(canvas);
  pipeline.setMediaSource(source, false);
  const out = configs.map((params) => {
    pipeline.updateConfig(params, gradientFor(params), opts.split ?? 0.5, opts.split !== undefined);
    pipeline.render();
    return canvas.toDataURL('image/jpeg', 0.86);
  });
  pipeline.destroy();
  return out;
}
