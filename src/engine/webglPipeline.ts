import { EffectParams, GradientMap } from '../types';
import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from '../shaders/halftoneShader';

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

const PATTERN_MAP: Record<string, number> = {
  halftone_dots: 0,
  wavy_engraving: 1,
  concentric_waves: 2,
  risograph_stipple: 3,
  xerox_grunge: 4,
  cmyk_rosette: 5,
  crosshatch: 6,
};

export class WebGLRetroPipeline {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private currentFps = 60;
  private onFpsUpdate?: (fps: number) => void;

  // Media source
  private currentSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null = null;
  private isVideoSource = false;

  // State cache
  private cachedParams: EffectParams | null = null;
  private cachedGradient: GradientMap | null = null;
  private splitPosition = 0.5;
  private showSplit = false;

  constructor(canvas: HTMLCanvasElement, onFpsUpdate?: (fps: number) => void) {
    this.canvas = canvas;
    this.onFpsUpdate = onFpsUpdate;
    this.initWebGL();
  }

  private initWebGL() {
    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.error('WebGL não disponível no navegador');
      return;
    }
    this.gl = gl;

    // Compile Shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Falha ao linkar programa shader:', gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;

    // Setup Quad Geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,  0.0, 1.0,
         1.0, -1.0,  1.0, 1.0,
        -1.0,  1.0,  0.0, 0.0,
        -1.0,  1.0,  0.0, 0.0,
         1.0, -1.0,  1.0, 1.0,
         1.0,  1.0,  1.0, 0.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aTexCoord = gl.getAttribLocation(program, 'a_texCoord');

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

    // Setup Texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Erro compilando shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public setMediaSource(source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, isVideo: boolean) {
    this.currentSource = source;
    this.isVideoSource = isVideo;

    if (!this.gl || !this.texture) return;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);

    // Initial upload
    this.updateTextureFromSource();

    if (this.isVideoSource) {
      this.startRenderLoop();
    } else {
      this.stopRenderLoop();
      this.render();
    }
  }

  private updateTextureFromSource() {
    if (!this.gl || !this.texture || !this.currentSource) return;
    try {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.currentSource
      );
    } catch {
      // Ignore transient errors on early video frames
    }
  }

  public updateConfig(params: EffectParams, gradient: GradientMap, splitPos: number, showSplit: boolean) {
    this.cachedParams = params;
    this.cachedGradient = gradient;
    this.splitPosition = splitPos;
    this.showSplit = showSplit;

    if (!this.isVideoSource) {
      this.render();
    }
  }

  public startRenderLoop() {
    if (this.animFrameId !== null) return;
    this.lastTime = performance.now();
    this.frameCount = 0;

    const loop = (now: number) => {
      this.animFrameId = requestAnimationFrame(loop);

      // FPS calculation
      this.frameCount++;
      const elapsed = now - this.lastTime;
      if (elapsed >= 500) {
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastTime = now;
        if (this.onFpsUpdate) {
          this.onFpsUpdate(this.currentFps);
        }
      }

      if (this.isVideoSource && this.currentSource) {
        this.updateTextureFromSource();
      }

      this.render();
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopRenderLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public render() {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.currentSource || !this.cachedParams) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(program);

    // Resolution & Time
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(uResolution, this.canvas.width, this.canvas.height);

    const uTime = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(uTime, performance.now() * 0.001);

    // Split View
    const uSplitPos = gl.getUniformLocation(program, 'u_split_pos');
    gl.uniform1f(uSplitPos, this.splitPosition);
    const uShowSplit = gl.getUniformLocation(program, 'u_show_split');
    gl.uniform1f(uShowSplit, this.showSplit ? 1.0 : 0.0);

    // Pattern uniforms
    const params = this.cachedParams;
    const uPatternType = gl.getUniformLocation(program, 'u_pattern_type');
    gl.uniform1i(uPatternType, PATTERN_MAP[params.patternType] ?? 0);

    const uFrequency = gl.getUniformLocation(program, 'u_frequency');
    gl.uniform1f(uFrequency, params.frequency);

    const uAngle = gl.getUniformLocation(program, 'u_angle');
    gl.uniform1f(uAngle, params.angle);

    const uContrast = gl.getUniformLocation(program, 'u_contrast');
    gl.uniform1f(uContrast, params.contrast);

    const uThreshold = gl.getUniformLocation(program, 'u_threshold');
    gl.uniform1f(uThreshold, params.threshold);

    const uInkBleed = gl.getUniformLocation(program, 'u_ink_bleed');
    gl.uniform1f(uInkBleed, params.inkBleed);

    const uMisreg = gl.getUniformLocation(program, 'u_misregistration');
    gl.uniform1f(uMisreg, params.misregistration);

    const uPaperGrain = gl.getUniformLocation(program, 'u_paper_grain');
    gl.uniform1f(uPaperGrain, params.paperGrain);

    const uXeroxGrit = gl.getUniformLocation(program, 'u_xerox_grit');
    gl.uniform1f(uXeroxGrit, params.xeroxGrit);

    const uWaveFreq = gl.getUniformLocation(program, 'u_wave_freq');
    gl.uniform1f(uWaveFreq, params.waveFrequency);

    const uWaveAmp = gl.getUniformLocation(program, 'u_wave_amp');
    gl.uniform1f(uWaveAmp, params.waveAmplitude);

    const uInvert = gl.getUniformLocation(program, 'u_invert');
    gl.uniform1f(uInvert, params.invert ? 1.0 : 0.0);

    // Color mode & colors
    const uColorMode = gl.getUniformLocation(program, 'u_color_mode');
    const colorModeInt = params.colorMode === 'original_cmyk' ? 1 : (params.colorMode === 'duotone_custom' ? 2 : 0);
    gl.uniform1i(uColorMode, colorModeInt);

    // Parse colors
    let shadowHex = '#111111';
    let midtoneHex: string | undefined = undefined;
    let highlightHex = '#F4F0E4';

    if (params.colorMode === 'duotone_custom') {
      shadowHex = params.customColors.shadow;
      midtoneHex = params.customColors.midtone;
      highlightHex = params.customColors.highlight;
    } else if (this.cachedGradient) {
      shadowHex = this.cachedGradient.colors[0];
      if (this.cachedGradient.colors.length === 3) {
        midtoneHex = this.cachedGradient.colors[1];
        highlightHex = this.cachedGradient.colors[2];
      } else {
        highlightHex = this.cachedGradient.colors[1];
      }
    }

    const shadowRgb = hexToRgb(shadowHex);
    const highlightRgb = hexToRgb(highlightHex);

    const uColorShadow = gl.getUniformLocation(program, 'u_color_shadow');
    gl.uniform3f(uColorShadow, shadowRgb[0], shadowRgb[1], shadowRgb[2]);

    const uColorHighlight = gl.getUniformLocation(program, 'u_color_highlight');
    gl.uniform3f(uColorHighlight, highlightRgb[0], highlightRgb[1], highlightRgb[2]);

    const uHasMidtone = gl.getUniformLocation(program, 'u_has_midtone');
    const uColorMidtone = gl.getUniformLocation(program, 'u_color_midtone');

    if (midtoneHex) {
      const midtoneRgb = hexToRgb(midtoneHex);
      gl.uniform1f(uHasMidtone, 1.0);
      gl.uniform3f(uColorMidtone, midtoneRgb[0], midtoneRgb[1], midtoneRgb[2]);
    } else {
      gl.uniform1f(uHasMidtone, 0.0);
      gl.uniform3f(uColorMidtone, 0.5, 0.5, 0.5);
    }

    // Active Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const uTexture = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(uTexture, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public resize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.render();
    }
  }

  public exportHighResolution(targetWidth: number, targetHeight: number): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;

    const pipeline = new WebGLRetroPipeline(offscreen);
    if (this.currentSource && this.cachedParams && this.cachedGradient) {
      pipeline.setMediaSource(this.currentSource, false);
      pipeline.updateConfig(this.cachedParams, this.cachedGradient, 0.5, false);
      pipeline.render();
      const dataUrl = offscreen.toDataURL('image/png', 1.0);
      pipeline.destroy();
      return dataUrl;
    }
    return '';
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public destroy() {
    this.stopRenderLoop();
    if (this.gl && this.texture) {
      this.gl.deleteTexture(this.texture);
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
    this.currentSource = null;
    this.gl = null;
  }
}
