export const VOICE_SAMPLE_RATE = 16_000;

/** Linear resample of a Float32 audio buffer from `inputRate` down to `VOICE_SAMPLE_RATE`. */
export function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === VOICE_SAMPLE_RATE) return input;
  const ratio = inputRate / VOICE_SAMPLE_RATE;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    output[i] = input[Math.floor(i * ratio)];
  }
  return output;
}

/** Float32 PCM in [-1, 1] -> little-endian PCM16 bytes, the wire format the STT backend expects. */
export function floatTo16BitPcm(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}
