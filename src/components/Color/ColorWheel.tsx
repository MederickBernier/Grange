import { useRef, type CSSProperties } from 'react';
import { useColorWheel, useFocusRing, VisuallyHidden } from 'react-aria';
import { useColorWheelState, type Color as AriaColor } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type ColorSlot,
  type SlotOverrides,
} from '../../config/config';
import { color as spec } from './specs';
import styles from './Color.module.scss';

export interface ColorWheelProps {
  value?: string | AriaColor;
  defaultValue?: string | AriaColor;
  onChange?: (value: AriaColor) => void;
  onChangeEnd?: (value: AriaColor) => void;
  /** The wheel's outer radius in px. */
  outerRadius?: number;
  /** The hole in the middle, in px. Where a `ColorArea` usually goes. */
  innerRadius?: number;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ColorSlot>;
}

/**
 * Hue, as a ring.
 *
 * The same channel a hue `ColorSlider` changes, drawn round. It is the one control here whose
 * geometry the hook needs told — `outerRadius` and `innerRadius` in pixels — because it has to
 * turn a pointer position into an angle, and it cannot measure a ring the way it can measure a
 * box.
 */
export function ColorWheel(props: ColorWheelProps) {
  const { defaults, slots } = useComponentConfig('ColorWheel');
  const {
    outerRadius = defaults?.outerRadius ?? spec.wheelOuterRadius,
    innerRadius = defaults?.innerRadius ?? spec.wheelInnerRadius,
    disabled,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const state = useColorWheelState({ ...rest, isDisabled: disabled });
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackProps, thumbProps, inputProps } = useColorWheel(
    { ...rest, isDisabled: disabled, outerRadius, innerRadius },
    state,
    inputRef,
  );
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: ColorSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  const size = outerRadius * 2;

  return (
    <div
      className={slot('root', 'grange-color-wheel', styles.wheel)}
      style={{ width: size, height: size, ...style }}
      data-disabled={disabled || undefined}
    >
      <div {...trackProps} className={styles.wheelTrack} />
      <div
        {...thumbProps}
        className={slot('thumb', 'grange-color-wheel-thumb', styles.thumb)}
        style={{ ...thumbProps.style, background: state.getDisplayColor().toString('css') }}
        data-focus-visible={isFocusVisible || undefined}
      >
        <VisuallyHidden>
          <input ref={inputRef} {...inputProps} {...focusProps} />
        </VisuallyHidden>
      </div>
    </div>
  );
}
