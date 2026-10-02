export const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

// Pattern parameters
uniform int u_pattern_type; // 0: dots, 1: wavy lines, 2: concentric, 3: riso stipple, 4: xerox, 5: cmyk rosette, 6: crosshatch
uniform float u_frequency;
uniform float u_angle;
uniform float u_contrast;
uniform float u_threshold;
uniform float u_ink_bleed;
uniform float u_misregistration;
uniform float u_paper_grain;
uniform float u_xerox_grit;
uniform float u_wave_freq;
uniform float u_wave_amp;

// Color parameters
uniform int u_color_mode; // 0: gradient map, 1: original cmyk, 2: custom duotone
uniform vec3 u_color_shadow;
uniform vec3 u_color_midtone;
uniform vec3 u_color_highlight;
uniform float u_has_midtone;
uniform float u_invert;

// Split screen comparison
uniform float u_split_pos;
uniform float u_show_split;

// Procedural pseudo-random hash
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// 2D Value Noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal paper fiber noise
float paperFiber(vec2 uv) {
  float n = noise(uv * 180.0) * 0.6;
  n += noise(uv * 360.0) * 0.3;
  n += hash(uv * 900.0) * 0.1;
  return n;
}

// 2D Rotation matrix
vec2 rotate(vec2 p, float rad) {
  float c = cos(rad);
  float s = sin(rad);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Convert RGB to perceptual Luminance
float rgb2luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// RGB to CMYK
vec4 rgb2cmyk(vec3 c) {
  float k = 1.0 - max(max(c.r, c.g), c.b);
  if (k >= 0.999) return vec4(0.0, 0.0, 0.0, 1.0);
  float invK = 1.0 / (1.0 - k);
  float cyan = (1.0 - c.r - k) * invK;
  float magenta = (1.0 - c.g - k) * invK;
  float yellow = (1.0 - c.b - k) * invK;
  return vec4(cyan, magenta, yellow, k);
}

// Sample texture with misregistration offset for a channel
vec3 sampleWithOffset(vec2 uv, vec2 offsetPixels) {
  vec2 offsetUV = offsetPixels / u_resolution;
  vec3 col;
  col.r = texture2D(u_texture, uv + offsetUV).r;
  col.g = texture2D(u_texture, uv).g;
  col.b = texture2D(u_texture, uv - offsetUV * 0.8).b;
  return col;
}

void main() {
  vec2 uv = v_texCoord;

  // Split-screen comparison
  if (u_show_split > 0.5) {
    if (uv.x < u_split_pos - 0.0015) {
      vec4 orig = texture2D(u_texture, uv);
      gl_FragColor = orig;
      return;
    } else if (abs(uv.x - u_split_pos) <= 0.0015) {
      // 1px divider bar with subtle contrast
      gl_FragColor = vec4(1.0, 0.84, 0.0, 1.0);
      return;
    }
  }

  // Misregistration channel shift (screenprint plates misaligned)
  vec2 misregOffset = vec2(0.0);
  if (u_misregistration > 0.01) {
    misregOffset = vec2(u_misregistration, -u_misregistration * 0.6);
  }

  vec3 baseColor = sampleWithOffset(uv, misregOffset);

  // Apply contrast and threshold
  float luma = rgb2luma(baseColor);
  luma = (luma - 0.5) * u_contrast + 0.5;
  luma = clamp(luma + (0.5 - u_threshold), 0.0, 1.0);

  if (u_invert > 0.5) {
    luma = 1.0 - luma;
  }

  // Aspect-corrected coordinate space for isometric pattern grids
  float aspect = u_resolution.x / u_resolution.y;
  vec2 aspectUV = vec2(uv.x * aspect, uv.y);
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 rotUV = rotate(aspectUV, rad);

  float patternVal = 0.0;
  float aa = 1.5 / u_frequency; // Antialiasing delta

  // PATTERN 0: Classic Halftone Dots (45° or custom angle)
  if (u_pattern_type == 0) {
    vec2 grid = fract(rotUV * u_frequency) - 0.5;
    float dist = length(grid);
    float dotRadius = sqrt(1.0 - luma) * 0.7071 * (1.0 + u_ink_bleed * 0.35);
    patternVal = smoothstep(dotRadius + aa, dotRadius - aa, dist);
  }
  // PATTERN 1: Woodcut Engraving Wavy Lines (as in user reference image)
  else if (u_pattern_type == 1) {
    float wave = sin(rotUV.x * u_frequency * 0.15 * u_wave_freq + (1.0 - luma) * 3.1415) * u_wave_amp * 0.3;
    float lineCoord = rotUV.y * u_frequency + wave;
    float dist = abs(fract(lineCoord) - 0.5);
    float strokeHalfWidth = (1.0 - luma) * 0.52 * (1.0 + u_ink_bleed * 0.4);
    patternVal = smoothstep(strokeHalfWidth + aa * 0.5, strokeHalfWidth - aa * 0.5, dist);
  }
  // PATTERN 2: Concentric Radial Waves
  else if (u_pattern_type == 2) {
    vec2 centerUV = aspectUV - vec2(0.5 * aspect, 0.5);
    float r = length(centerUV) * u_frequency;
    float theta = atan(centerUV.y, centerUV.x);
    float ripple = sin(r + sin(theta * 6.0) * u_wave_amp * 1.5);
    float dist = abs(fract(r * 0.5 + ripple * 0.25) - 0.5);
    float strokeWidth = (1.0 - luma) * 0.5 * (1.0 + u_ink_bleed * 0.3);
    patternVal = smoothstep(strokeWidth + aa, strokeWidth - aa, dist);
  }
  // PATTERN 3: Risograph Stipple with channel separation
  else if (u_pattern_type == 3) {
    float grain = hash(uv * u_resolution * 0.65 + vec2(sin(u_time * 0.05)));
    float stipple = smoothstep(luma - 0.25 - u_ink_bleed * 0.2, luma + 0.25, grain);
    vec2 miniGrid = fract(rotUV * u_frequency * 1.2) - 0.5;
    float dotDist = length(miniGrid);
    float radD = sqrt(1.0 - luma) * 0.65;
    float dotMask = smoothstep(radD + aa, radD - aa, dotDist);
    patternVal = mix(1.0 - stipple, dotMask, 0.45);
  }
  // PATTERN 4: Xerox Grunge & Fanzine Toner Grit
  else if (u_pattern_type == 4) {
    float gritNoise = hash(uv * u_resolution * 0.85);
    float fanzineFibers = paperFiber(uv * 12.0);
    float thresholdNoise = luma + (gritNoise - 0.5) * (u_xerox_grit * 0.9) - fanzineFibers * 0.15;
    float toner = step(thresholdNoise, 0.52 - u_ink_bleed * 0.15);
    
    // Add analog speckle clusters
    float flecks = step(0.985 - u_xerox_grit * 0.03, hash(uv * 120.0));
    patternVal = clamp(toner + flecks * 0.8, 0.0, 1.0);
  }
  // PATTERN 5: CMYK Rosette
  else if (u_pattern_type == 5) {
    vec4 cmyk = rgb2cmyk(baseColor);
    
    // Cyan at 15°
    vec2 uvC = rotate(aspectUV, 15.0 * 3.14159 / 180.0) * u_frequency;
    float distC = length(fract(uvC) - 0.5);
    float valC = smoothstep(sqrt(cmyk.x) * 0.6 + aa, sqrt(cmyk.x) * 0.6 - aa, distC);

    // Magenta at 75°
    vec2 uvM = rotate(aspectUV, 75.0 * 3.14159 / 180.0) * u_frequency;
    float distM = length(fract(uvM) - 0.5);
    float valM = smoothstep(sqrt(cmyk.y) * 0.6 + aa, sqrt(cmyk.y) * 0.6 - aa, distM);

    // Yellow at 0°
    vec2 uvY = rotate(aspectUV, 0.0) * u_frequency;
    float distY = length(fract(uvY) - 0.5);
    float valY = smoothstep(sqrt(cmyk.z) * 0.6 + aa, sqrt(cmyk.z) * 0.6 - aa, distY);

    // Black (Key) at 45°
    vec2 uvK = rotate(aspectUV, 45.0 * 3.14159 / 180.0) * u_frequency;
    float distK = length(fract(uvK) - 0.5);
    float valK = smoothstep(sqrt(cmyk.w) * 0.6 + aa, sqrt(cmyk.w) * 0.6 - aa, distK);

    if (u_color_mode == 1) {
      // Reconstruct CMYK print on paper
      vec3 paperWhite = vec3(0.96, 0.95, 0.92);
      vec3 inkCyan = vec3(0.0, 0.62, 0.85);
      vec3 inkMagenta = vec3(0.88, 0.12, 0.45);
      vec3 inkYellow = vec3(0.98, 0.88, 0.05);
      vec3 inkKey = vec3(0.12, 0.11, 0.12);

      vec3 result = paperWhite;
      result = mix(result, result * inkCyan, valC * (1.0 + u_ink_bleed * 0.2));
      result = mix(result, result * inkMagenta, valM * (1.0 + u_ink_bleed * 0.2));
      result = mix(result, result * inkYellow, valY * (1.0 + u_ink_bleed * 0.2));
      result = mix(result, inkKey, valK);

      // Add paper texture
      if (u_paper_grain > 0.01) {
        float pGrain = paperFiber(uv * 15.0);
        result *= (1.0 - (pGrain - 0.5) * u_paper_grain * 0.25);
      }

      gl_FragColor = vec4(result, 1.0);
      return;
    } else {
      patternVal = max(max(valC, valM), max(valY, valK));
    }
  }
  // PATTERN 6: Crosshatch Line Engraving
  else if (u_pattern_type == 6) {
    vec2 uv1 = rotate(aspectUV, rad) * u_frequency;
    vec2 uv2 = rotate(aspectUV, rad + 1.57079) * u_frequency;
    float line1 = abs(fract(uv1.y) - 0.5);
    float line2 = abs(fract(uv2.y) - 0.5);
    float w1 = (1.0 - luma) * 0.5 * (1.0 + u_ink_bleed * 0.3);
    float w2 = max(0.0, (0.6 - luma) * 0.8);
    float p1 = smoothstep(w1 + aa, w1 - aa, line1);
    float p2 = smoothstep(w2 + aa, w2 - aa, line2);
    patternVal = max(p1, p2);
  }

  // Paper fiber and pulp noise
  float grainNoise = 0.0;
  if (u_paper_grain > 0.01) {
    grainNoise = (paperFiber(uv * 16.0) - 0.5) * u_paper_grain * 0.35;
  }

  // Apply Xerox edge grit
  if (u_xerox_grit > 0.01) {
    float grit = (hash(uv * u_resolution * 0.5) - 0.5) * u_xerox_grit * 0.25;
    patternVal = clamp(patternVal + grit, 0.0, 1.0);
  }

  // Final Color Mapping
  vec3 finalColor;

  if (u_color_mode == 0 || u_color_mode == 2) {
    // Gradient map duotone / tritone mapping
    // patternVal is 1.0 where ink is deposited (shadows), and 0.0 where paper is exposed (highlights)
    float inkAmount = clamp(patternVal, 0.0, 1.0);

    if (u_has_midtone > 0.5) {
      if (inkAmount < 0.5) {
        // Between highlight (paper) and midtone
        finalColor = mix(u_color_highlight, u_color_midtone, inkAmount * 2.0);
      } else {
        // Between midtone and shadow (deep ink)
        finalColor = mix(u_color_midtone, u_color_shadow, (inkAmount - 0.5) * 2.0);
      }
    } else {
      // Direct duotone interpolation
      finalColor = mix(u_color_highlight, u_color_shadow, inkAmount);
    }
  } else {
    // Preserved source color modulated by ink screen pattern
    finalColor = mix(vec3(0.96, 0.95, 0.92), baseColor, patternVal);
  }

  // Modulate paper grain on top
  finalColor = clamp(finalColor + grainNoise, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
