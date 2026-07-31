import { createPrng } from "./prng";

export interface CoreParticle {
  readonly angle: number;
  /** 0..1, fraction of the core's outer radius. */
  readonly radius: number;
  /** Relative size multiplier. */
  readonly size: number;
  /** Orbital angular speed in radians/sec (sign = direction). */
  readonly angularSpeed: number;
  /** Opacity-pulse speed in radians/sec. */
  readonly pulseSpeed: number;
  readonly phase: number;
  /** 0 = white, 1 = state accent primary, 2 = state accent secondary. */
  readonly palette: 0 | 1 | 2;
}

/**
 * Deterministic particle field filling a dense, roughly-uniform sphere
 * (mild center bias) so the Core reads as a glowing dust cloud rather
 * than a sparse instrument dial.
 */
export function generateCoreParticles(count: number, seed = 4242): readonly CoreParticle[] {
  const rand = createPrng(seed);
  const particles: CoreParticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const paletteRoll = rand();
    const palette: CoreParticle["palette"] = paletteRoll < 0.35 ? 0 : paletteRoll < 0.68 ? 1 : 2;

    particles.push({
      angle: rand() * Math.PI * 2,
      radius: Math.pow(rand(), 0.82) * 0.97 + 0.02,
      size: 0.28 + rand() * 1.0,
      angularSpeed: (rand() - 0.5) * 0.12,
      pulseSpeed: 0.3 + rand() * 0.8,
      phase: rand() * Math.PI * 2,
      palette,
    });
  }

  return particles;
}
