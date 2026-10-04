import { useCallback, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { TextButton } from '../Button/variants';
import {
  resolveSlotClass,
  useComponentConfig,
  type SignatureSlot,
  type SlotOverrides,
} from '../../config/config';
import { signature as spec } from './specs';
import { strokeBounds, strokePath, strokesToSvg, thin, type Stroke } from './strokes';
import styles from './Signature.module.scss';

export interface SignatureProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  /** Fired at the end of every stroke with a standalone SVG document, or null once cleared. */
  onChange?: (svg: string | null) => void;
  /** The pad, px. Defaults to the chosen 320 by 140. */
  width?: number;
  height?: number;
  /** The ink width in the pad's own units, px. */
  strokeWidth?: number;
  /**
   * The ink colour, as a CSS colour. It ends up inside an exported SVG document, so it cannot be
   * `currentColor`; the default is the on-surface token read as a literal.
   */
  color?: string;
  /** Hides the Clear and Undo buttons, for a form that provides its own. */
  hideControls?: boolean;
  clearLabel?: string;
  undoLabel?: string;
  supportingText?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SignatureSlot>;
}

/**
 * A signature pad.
 *
 * It draws into an `<svg>`, not a `<canvas>`, and that is the substantive decision here. A canvas
 * signature is a bitmap: it blurs when the box is resized, undo means replaying every stroke into
 * a fresh context, and none of it can be tested without a canvas implementation. The same strokes
 * as SVG paths stay crisp at any size, export as readable text, and undo is dropping the last
 * array. The geometry is in `strokes.ts` and tested there.
 *
 * **It cannot be used without a pointer, and nothing can fix that.** Drawing a signature is a
 * physical gesture; there is no keyboard equivalent to invent. So the pad reports itself honestly
 * — `role="img"` with a label that says whether anything has been signed, rather than pretending
 * to be an input — and its Clear and Undo controls are ordinary buttons that are reachable like
 * any other. A form that requires a signature should offer a typed name as an alternative, and
 * `supportingText` is the place to say so.
 */
export function Signature(props: SignatureProps) {
  const { defaults, slots } = useComponentConfig('Signature');
  const {
    label,
    onChange,
    width = defaults?.width ?? spec.width,
    height = defaults?.height ?? spec.height,
    strokeWidth = defaults?.strokeWidth ?? spec.strokeWidth,
    color = 'var(--md-sys-color-on-surface)',
    hideControls = false,
    clearLabel = 'Clear',
    undoLabel = 'Undo',
    supportingText,
    disabled,
    readOnly,
    error,
    className,
    classNames,
    style,
    ...aria
  } = props;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef<number | null>(null);
  const surface = useRef<SVGSVGElement>(null);
  const locked = disabled || readOnly;

  const report = useCallback(
    (next: Stroke[]) => {
      setStrokes(next);
      // The exported document needs a real colour, since currentColor means nothing in a file.
      onChange?.(
        strokesToSvg(next, { width, height, strokeWidth, color: resolveColor(surface.current, color) }),
      );
    },
    [color, height, onChange, strokeWidth, width],
  );

  /** Pointer coordinates in the pad's own units, so the value survives a resize. */
  const pointIn = (event: PointerEvent<SVGSVGElement>) => {
    const box = surface.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - box.left) / box.width) * width,
      y: ((event.clientY - box.top) / box.height) * height,
    };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (locked || event.button !== 0) return;
    event.preventDefault();
    surface.current?.setPointerCapture?.(event.pointerId);
    drawing.current = event.pointerId;
    setStrokes((was) => [...was, [pointIn(event)]]);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (drawing.current !== event.pointerId) return;
    const point = pointIn(event);
    setStrokes((was) => {
      const last = was[was.length - 1];
      if (!last) return was;
      const previous = last[last.length - 1];
      // Thin as it goes rather than at the end, so a long stroke does not accumulate samples
      // nobody will ever see.
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < spec.sampleTolerance)
        return was;
      return [...was.slice(0, -1), [...last, point]];
    });
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (drawing.current !== event.pointerId) return;
    drawing.current = null;
    surface.current?.releasePointerCapture?.(event.pointerId);
    setStrokes((was) => {
      const next = was.map((stroke, i) =>
        i === was.length - 1 ? thin(stroke, spec.sampleTolerance) : stroke,
      );
      // Reported here rather than on every move: a value per pixel of movement is noise.
      onChange?.(
        strokesToSvg(next, { width, height, strokeWidth, color: resolveColor(surface.current, color) }),
      );
      return next;
    });
  };

  const slot = (name: SignatureSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const signed = strokeBounds(strokes) !== null;
  const name = aria['aria-label'] ?? (typeof label === 'string' ? label : 'Signature');

  return (
    <div
      className={slot('root', 'grange-signature', styles.root)}
      style={style}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-error={error || undefined}
      data-signed={signed || undefined}
    >
      {label != null && (
        <span className={slot('label', 'grange-signature-label', styles.label)}>{label}</span>
      )}

      <svg
        ref={surface}
        className={slot('surface', 'grange-signature-surface', styles.surface)}
        viewBox={`0 0 ${width} ${height}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        /*
         * An image rather than an input, because that is what it is: there is no keyboard way to
         * draw, so claiming to be a control would promise something it cannot do. The label says
         * whether anything has been signed, which is the part a screen reader can use.
         */
        role="img"
        aria-label={`${name}: ${signed ? 'signed' : 'empty'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          {strokes.map((stroke, i) => (
            <path key={i} d={strokePath(stroke)} />
          ))}
        </g>
        {/* The line to sign on, which is decoration and says so. */}
        <line
          className={styles.rule}
          x1={16}
          x2={width - 16}
          y1={height - 24}
          y2={height - 24}
          aria-hidden="true"
        />
      </svg>

      {(supportingText != null || (!hideControls && !locked)) && (
        <div className={slot('actions', 'grange-signature-actions', styles.actions)}>
          <span className={styles.supporting}>{supportingText}</span>
          {!hideControls && !locked && (
            <span className={styles.buttons}>
              <TextButton
                size="xs"
                disabled={strokes.length === 0}
                onClick={() => report(strokes.slice(0, -1))}
              >
                {undoLabel}
              </TextButton>
              <TextButton size="xs" disabled={strokes.length === 0} onClick={() => report([])}>
                {clearLabel}
              </TextButton>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Turns the ink colour into something an exported file can use.
 *
 * The default is a custom property, which resolves against the document and therefore means
 * nothing inside a standalone SVG. Read here while the element is still in the page; if there is
 * nothing to read it against — a server render, a test without layout — the property is left as
 * it is rather than guessed at.
 */
function resolveColor(element: SVGSVGElement | null, color: string): string {
  const property = /^var\((--[^),]+)/.exec(color.trim());
  if (!property || !element || typeof getComputedStyle !== 'function') return color;
  const resolved = getComputedStyle(element).getPropertyValue(property[1]!).trim();
  return resolved || color;
}
