import { useRef, type CSSProperties } from 'react';
import { useColorArea, useFocusRing, VisuallyHidden } from 'react-aria';
import { useColorAreaState, type Color as AriaColor, type ColorChannel, type ColorSpace } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type ColorSlot,
  type SlotOverrides,
} from '../../config/config';
import { color as spec } from './specs';
import styles from './Color.module.scss';

export interface ColorAreaProps {
  value?: string | AriaColor;
  defaultValue?: string | AriaColor;
  onChange?: (value: AriaColor) => void;
  /** Fired once at the end of a drag, which is what a form should listen to. */
  onChangeEnd?: (value: AriaColor) => void;
  colorSpace?: ColorSpace;
  /**
   * The horizontal channel. Left out, it follows the value's own colour space — saturation for
   * an HSB colour, red for an RGB one — which is the hook's rule and the only one that cannot
   * be wrong: asking an `rgb()` value for its saturation throws.
   */
  xChannel?: ColorChannel;
  /** The vertical channel. Follows the value's colour space in the same way. */
  yChannel?: ColorChannel;
  disabled?: boolean;
  /** The square's size in px. */
  size?: number;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ColorSlot>;
}

/**
 * The saturation and brightness square — the catalog's ColorGradient.
 *
 * **It is range inputs, not a canvas**, which is the whole accessibility story. A picker drawn
 * on a canvas with mousedown handlers cannot be used without a pointer at all.
 *
 * `useColorArea` renders one input per axis but exposes only one of them: the second carries
 * `aria-hidden` and `tabindex="-1"`, and the first is given `aria-roledescription="2D slider"`
 * with a value text naming both channels — "Saturation: 50%, Brightness: 60%, Hue: 220°, dark
 * grayish cyan blue". That is a better answer than two separate sliders, because the square
 * *is* one control, and it means the colour is described in words rather than in numbers.
 *
 * The gradients are plain CSS, which is what the hook's own `background` expects: a white-to-
 * transparent layer across and a black-to-transparent layer down, over the hue. That is why
 * the square needs no painting code and stays sharp at any size.
 *
 * The axes default to the value's own colour space rather than to saturation and brightness.
 * Forcing those would throw on an `rgb()` or hex value, which has no saturation channel at
 * all — give it an `hsb()` colour to get the square a picker draws.
 */
export function ColorArea(props: ColorAreaProps) {
  const { defaults, slots } = useComponentConfig('ColorArea');
  const {
    xChannel,
    yChannel,
    size = defaults?.size ?? spec.areaSize,
    disabled,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const state = useColorAreaState({ ...rest, xChannel, yChannel, isDisabled: disabled });
  const inputXRef = useRef<HTMLInputElement>(null);
  const inputYRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { colorAreaProps, thumbProps, xInputProps, yInputProps } = useColorArea(
    { ...rest, xChannel, yChannel, isDisabled: disabled, inputXRef, inputYRef, containerRef },
    state,
  );
  const { focusProps, isFocusVisible } = useFocusRing({ within: true });

  const slot = (name: ColorSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div
      {...colorAreaProps}
      {...focusProps}
      ref={containerRef}
      className={slot('root', 'grange-color-area', styles.area)}
      style={{ ...colorAreaProps.style, width: size, height: size, ...style }}
      data-disabled={disabled || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <div
        {...thumbProps}
        className={slot('thumb', 'grange-color-area-thumb', styles.thumb)}
        style={{ ...thumbProps.style, background: state.getDisplayColor().toString('css') }}
      >
        <VisuallyHidden>
          <input ref={inputXRef} {...xInputProps} />
          <input ref={inputYRef} {...yInputProps} />
        </VisuallyHidden>
      </div>
    </div>
  );
}
