import { useMemo, type CSSProperties } from 'react';
import { resolveSlotClass, useComponentConfig, type CodeSlot, type SlotOverrides } from '../../config/config';
import { moduleWidth, widths } from './code128';
import { code as spec } from './specs';
import styles from './Code.module.scss';

export interface BarcodeProps {
  /** What to encode. ASCII 32 to 126; anything else throws rather than scanning as something else. */
  value: string;
  /** How wide one module is, px. The bars are whole multiples of it. */
  moduleSize?: number;
  /** The bars' height, px. */
  height?: number;
  /** Prints the value under the bars, as a scanner's human-readable line. */
  showValue?: boolean;
  /**
   * The quiet zone either side, in modules. Ten is the standard's minimum, and a barcode
   * printed without one is a barcode that does not scan.
   */
  quietZone?: number;
  /**
   * What it says out loud. Defaults to the value, because a barcode is a picture of exactly
   * that and a screen reader should be able to read it without a scanner.
   */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<CodeSlot>;
}

/**
 * A Code 128 barcode, encoded here rather than brought in.
 *
 * A barcode library is a lookup table and a checksum, and the dependency costs more than the
 * code. The encoder is in `code128.ts`, pure, and its table is guarded by arithmetic rather
 * than by proof-reading: every symbol is six widths adding to eleven modules, which a mistyped
 * digit breaks.
 *
 * **The quiet zone is part of the barcode, not margin around it.** Ten modules either side is
 * the standard's minimum, and a symbol printed flush to its container will not scan. It is
 * inside the SVG so it cannot be cropped off by a layout.
 *
 * **It reads its own value out.** A barcode is a picture of a string; a screen reader user
 * should not need a scanner to find out which.
 */
export function Barcode(props: BarcodeProps) {
  const { defaults, slots } = useComponentConfig('Barcode');
  const {
    value,
    moduleSize = defaults?.moduleSize ?? spec.moduleSize,
    height = defaults?.height ?? spec.barHeight,
    showValue = defaults?.showValue ?? true,
    quietZone = defaults?.quietZone ?? spec.quietZone,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const bars = useMemo(() => widths(value), [value]);
  const modules = useMemo(() => moduleWidth(value), [value]);
  const total = modules + quietZone * 2;

  const slot = (name: CodeSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  // Drawn in module units and scaled by the viewBox, so the bars stay on whole modules at any
  // size — a bar landing on half a pixel is a bar a scanner may not read.
  const textHeight = showValue ? spec.textHeight : 0;

  /*
   * Where each bar starts, worked out up front. Accumulating an offset inside the map below
   * reads more naturally and is wrong: the callback runs while React renders, and a variable
   * it reassigns is not guaranteed to be in any particular state when it does.
   */
  const offsets = bars.reduce<number[]>(
    (acc, width, index) => [...acc, (acc[index - 1] ?? quietZone) + (index === 0 ? 0 : bars[index - 1]!)],
    [],
  );

  return (
    <svg
      className={slot('root', 'grange-barcode', styles.barcode)}
      style={style}
      width={total * moduleSize}
      height={height + textHeight * moduleSize}
      viewBox={`0 0 ${total} ${height / moduleSize + textHeight}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? value}
    >
      {/* The quiet zone is part of the symbol, so the background is drawn across all of it. */}
      <rect width={total} height={height / moduleSize + textHeight} className={styles.quiet} />

      {bars.map((width, index) =>
        // Even indices are bars, odd ones spaces: the pattern always starts with a bar.
        index % 2 === 0 ? (
          <rect
            key={index}
            x={offsets[index]}
            y={0}
            width={width}
            height={height / moduleSize}
            className={styles.bar}
          />
        ) : null,
      )}

      {showValue && (
        <text
          x={total / 2}
          y={height / moduleSize + textHeight * 0.8}
          textAnchor="middle"
          className={styles.caption}
          // Decoration: the whole image is already labelled with the value.
          aria-hidden="true"
        >
          {value}
        </text>
      )}
    </svg>
  );
}
