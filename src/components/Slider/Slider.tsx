import { forwardRef, useRef, type CSSProperties, type ReactNode } from 'react';
import { VisuallyHidden, useFocusRing, useNumberFormatter, useSlider, useSliderThumb } from 'react-aria';
import { useSliderState, type SliderState } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type SliderSlot,
  type SlotOverrides,
} from '../../config/config';
import { pieceInsets, slider as spec, stopPositions, trackPieces } from './specs';
import styles from './Slider.module.scss';

export interface SliderProps {
  /** The visible label. Without one, pass aria-label. */
  label?: ReactNode;
  /** A number for one handle, or two for a range. */
  value?: number | number[];
  defaultValue?: number | number[];
  onChange?: (value: number | number[]) => void;
  /** Fired once when dragging ends, for work too costly to do on every move. */
  onChangeEnd?: (value: number | number[]) => void;
  minValue?: number;
  maxValue?: number;
  /** Granularity of the value. Must be above 0, as React Aria requires. */
  step?: number;
  /**
   * Draws a stop indicator at every step. Opt in, because a step of 1 over 0 to 100 would mean
   * 101 dots: the spec shows stops for a genuinely discrete slider, not for a fine-grained one.
   */
  stops?: boolean;
  disabled?: boolean;
  /** Shows the value in a bubble above the handle while it is being used. */
  valueIndicator?: boolean;
  /** Formats the value for the bubble and for assistive tech. */
  formatOptions?: Intl.NumberFormatOptions;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<SliderSlot>;
}

/**
 * A slider, restyled by M3 Expressive: a thick 16px track with a 4 by 44 bar for a handle that
 * sits in a gap cut out of the track rather than on top of it, and narrows to 2px while you hold
 * it. One handle or two, continuous or stepped.
 *
 * Built on React Aria's useSlider, so dragging, the arrow keys, Home and End, Page Up and Page
 * Down and the right ARIA all come from there rather than from mouse maths here.
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(props, ref) {
  const { slots } = useComponentConfig('Slider');
  const {
    label,
    value,
    defaultValue,
    onChange,
    onChangeEnd,
    minValue = 0,
    maxValue = 100,
    step = 1,
    stops: showStops = false,
    disabled,
    valueIndicator = true,
    formatOptions,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const trackRef = useRef<HTMLDivElement>(null);
  // React Aria divides by the step, so a zero or negative one would make every position NaN and
  // put calc(NaN%) into the DOM.
  const safeStep = step > 0 ? step : 1;
  const ariaProps = {
    ...rest,
    label,
    value,
    defaultValue: defaultValue ?? (value === undefined ? minValue : undefined),
    onChange,
    onChangeEnd,
    minValue,
    maxValue,
    step: safeStep,
    isDisabled: disabled,
    formatOptions,
  };

  const formatter = useNumberFormatter(formatOptions);
  const state = useSliderState({ ...ariaProps, numberFormatter: formatter });
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(ariaProps, state, trackRef);

  // Guarded so a position that is not a real number can never reach a calc().
  const positions = state.values
    .map((_, index) => state.getThumbPercent(index))
    .filter((p) => Number.isFinite(p));
  const handleWidth = spec.handleWidth;
  const pieces = trackPieces(positions);
  const stops = showStops ? stopPositions(minValue, maxValue, safeStep) : [];

  const slot = (name: SliderSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  return (
    <div
      {...groupProps}
      ref={ref}
      className={slot('root', 'grange-slider', styles.root)}
      style={style}
      data-disabled={disabled || undefined}
    >
      {label != null && (
        <div className={styles.header}>
          <span {...labelProps} className={slot('label', 'grange-slider-label', styles.label)}>
            {label}
          </span>
          <output {...outputProps} className={styles.output}>
            {state.values.map((v) => state.getFormattedValue(v)).join(' – ')}
          </output>
        </div>
      )}

      <div {...trackProps} ref={trackRef} className={slot('track', 'grange-slider-track', styles.track)}>
        {pieces.map((piece, index) => {
          const insets = pieceInsets(piece, positions, handleWidth);
          return (
            <span
              key={index}
              className={piece.active ? styles.active : styles.inactive}
              aria-hidden="true"
              style={{
                left: `calc(${piece.from * 100}% + ${insets.start}px)`,
                right: `calc(${(1 - piece.to) * 100}% + ${insets.end}px)`,
              }}
            >
              {piece.active &&
                stops
                  .filter((at) => at > piece.from && at < piece.to)
                  .map((at) => (
                    <span
                      key={at}
                      className={`grange-slider-stop ${styles.stop}`}
                      // Positioned within the piece, so the dots stay put as the piece resizes.
                      style={{ left: `${((at - piece.from) / (piece.to - piece.from)) * 100}%` }}
                    />
                  ))}
            </span>
          );
        })}

        {state.values.map((_, index) => (
          <Thumb
            key={index}
            index={index}
            state={state}
            trackRef={trackRef}
            valueIndicator={valueIndicator}
            className={slot('handle', 'grange-slider-handle', styles.handle)}
          />
        ))}
      </div>
    </div>
  );
});

function Thumb({
  index,
  state,
  trackRef,
  valueIndicator,
  className,
}: {
  index: number;
  state: SliderState;
  trackRef: React.RefObject<HTMLDivElement | null>;
  valueIndicator: boolean;
  className: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { thumbProps, inputProps, isDragging } = useSliderThumb({ index, trackRef, inputRef }, state);
  const { focusProps, isFocusVisible } = useFocusRing();
  const showIndicator = valueIndicator && (isDragging || isFocusVisible);

  return (
    <span
      {...thumbProps}
      className={className}
      style={{ ...thumbProps.style, left: `${state.getThumbPercent(index) * 100}%` }}
      data-dragging={isDragging || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <VisuallyHidden>
        <input ref={inputRef} {...inputProps} {...focusProps} />
      </VisuallyHidden>
      {showIndicator && (
        <span className={styles.valueIndicator} aria-hidden="true">
          {state.getThumbValueLabel(index)}
        </span>
      )}
    </span>
  );
}
