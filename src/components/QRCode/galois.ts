/**
 * GF(256) arithmetic and Reed–Solomon error correction, which is what a QR code is made of.
 *
 * The field is the one the QR standard specifies: byte values under the primitive polynomial
 * 0x11D. Multiplication is done through exponent and logarithm tables, built once, because
 * multiplying two bytes the long way for every codeword of every block is the slow part of an
 * encoder that has no other slow part.
 */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

{
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    // The field's primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1.
    if (value & 0x100) value ^= 0x11d;
  }
  // Doubled, so a product of two logarithms can be looked up without a modulo.
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]!;
}

/** Multiplication in GF(256). Zero is zero; everything else goes through the logarithms. */
export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a]! + LOG[b]!]!;
}

/**
 * The generator polynomial for `degree` error-correction codewords.
 *
 * It is the product of (x - α^i) for i from 0, built up term by term. Coefficients are highest
 * power first.
 */
export function generator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i += 1) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j += 1) {
      // Shifting up multiplies by x; the other term multiplies by α^i. Highest power first,
      // which is the order the long division below walks in.
      next[j] = (next[j]! ^ poly[j]!) as number;
      next[j + 1] = (next[j + 1]! ^ gfMul(poly[j]!, EXP[i]!)) as number;
    }
    poly = next;
  }
  return poly;
}

/**
 * The error-correction codewords for one block: the remainder of the data, shifted up by the
 * generator's degree, divided by the generator.
 *
 * Long division in GF(256), where subtraction is exclusive-or. The remainder is what the
 * decoder uses to repair damage, and a symbol with the wrong remainder scans as nothing at all
 * rather than as something wrong — which is at least a loud failure.
 */
export function remainder(data: Uint8Array, degree: number): Uint8Array {
  const gen = generator(degree);
  const out = new Uint8Array(data.length + degree);
  out.set(data);

  for (let i = 0; i < data.length; i += 1) {
    const factor = out[i]!;
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j += 1) {
      out[i + j] = (out[i + j]! ^ gfMul(gen[j]!, factor)) as number;
    }
  }

  return out.slice(data.length);
}
