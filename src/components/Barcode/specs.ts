/**
 * Barcode and QR code.
 *
 * Nothing captured, and nothing to capture: these are not Material components, they are
 * encodings with their own standards. The only values here are the drawing ones, and the two
 * that matter — the quiet zones — come from the standards rather than from taste: Code 128
 * requires ten modules either side, and a QR code four.
 */
export const code = {
  /** One module, px. Chosen: the smallest a printer reliably reproduces. */
  moduleSize: 2,
  /** The bars, px. Chosen. */
  barHeight: 64,
  /** Room under the bars for the human-readable line, in modules. Chosen. */
  textHeight: 10,
  /** Code 128's required quiet zone, in modules. From the standard, not chosen. */
  quietZone: 10,
  /** A QR code's required quiet zone, in modules. From the standard, not chosen. */
  qrQuietZone: 4,
  /** A QR module, px. Chosen. */
  qrModuleSize: 4,
} as const;
