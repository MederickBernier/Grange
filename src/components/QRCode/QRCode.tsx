import { useMemo, type CSSProperties } from 'react';
import {
  resolveSlotClass,
  useComponentConfig,
  type CodeSlot,
  type SlotOverrides,
} from '../../config/config';
import { encode, type EcLevel } from './qr';
import { code as spec } from '../Barcode/specs';
import styles from '../Barcode/Code.module.scss';

export interface QRCodeProps {
  /** What to encode. Any string: it is written as UTF-8 in byte mode. */
  value: string;
  /**
   * How much damage the symbol can survive, from L (about 7%) to H (about 30%). Higher costs
   * modules, so the same string needs a bigger symbol.
   */
  level?: EcLevel;
  /** One module, px. */
  moduleSize?: number;
  /**
   * The quiet zone, in modules. Four is what the standard requires, and a QR code printed
   * without one does not scan.
   */
  quietZone?: number;
  /**
   * What it says out loud. Defaults to the value, because a QR code is a picture of exactly
   * that — a screen reader user should not need a camera to read it.
   */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CodeSlot>;
}

/**
 * A QR code, encoded here rather than brought in.
 *
 * Byte mode, every error-correction level, up to version 10 — 57 by 57 modules, 271 bytes at
 * level L. That covers what people actually put in a QR code: a URL, a ticket id, a Wi-Fi
 * string. Past version 10 the tables keep going; the cap is where transcribing more stopped
 * being worth it, and `encode` throws rather than drawing something that will not scan.
 *
 * The encoder is in `qr.ts` with its Reed–Solomon in `galois.ts`, both pure. **Every table is
 * checked by arithmetic rather than by eye**: the block table's codewords must add to each
 * version's known capacity, the format and version information are computed from their BCH
 * generators rather than transcribed, and a round-trip test reads the codewords back out of
 * the finished grid. That last one earned its place — it caught an alignment pattern being
 * dropped from version 7 upwards, which produced a symbol that looked like a QR code and
 * scanned as nothing.
 */
export function QRCode(props: QRCodeProps) {
  const { defaults, slots } = useComponentConfig('QRCode');
  const {
    value,
    level = defaults?.level ?? 'M',
    moduleSize = defaults?.moduleSize ?? spec.qrModuleSize,
    quietZone = defaults?.quietZone ?? spec.qrQuietZone,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const grid = useMemo(() => encode(value, level), [value, level]);
  const size = grid.length + quietZone * 2;

  const slot = (name: CodeSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  /*
   * One path for every dark module rather than one rect each. A version 10 symbol is 3249
   * modules, and roughly half of them being their own element is a thousand nodes nobody
   * needs — a scanner reads the shape, not the DOM.
   */
  const path = grid
    .flatMap((row, y) =>
      row.map((module, x) => (module === 1 ? `M${x + quietZone} ${y + quietZone}h1v1h-1z` : '')),
    )
    .join('');

  return (
    <svg
      className={slot('root', 'grange-qr-code', styles.qr)}
      style={style}
      width={size * moduleSize}
      height={size * moduleSize}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={ariaLabel ?? value}
    >
      {/* The quiet zone is part of the symbol, so the light background covers all of it. */}
      <rect width={size} height={size} className={styles.quiet} />
      <path d={path} className={styles.module} />
    </svg>
  );
}
