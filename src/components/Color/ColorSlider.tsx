import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useColorSlider, useFocusRing, useLocale, VisuallyHidden } from 'react-aria';
import { useColorSliderState, type Color as AriaColor, type ColorChannel, type ColorSpace } from 'react-stately';
import {
  resolveSlotClass,
  useComponentConfig,
  type ColorSlot,
  type SlotOverrides,
} from '../../config/config';
import { color as spec } from './specs';
import styles from './Color.module.scss';

export interface ColorSliderProps {
  /** Which channel this slider changes: hue, saturation, lightness, alpha, red… */
  channel: ColorChannel;
  value?: string | AriaColor;
  defaultValue?: string | AriaColor;
  onChange?: (value: AriaColor) => void;
  onChangeEnd?: (value: AriaColor) => void;
  colorSpace?: ColorSpace;
  orientation?: 'horizontal' | 'vertical';
  /** The visible label. Without one the channel's own name is used, which is usually right. */
  label?: ReactNode;
  /** Shows the channel's value beside the label, which is what a picker usually wants. */
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ColorSlot>;
}

/**
 * One channel of a colour, as a slider.
 *
 * Hue, alpha, red, lightness — whichever channel it is given. The track's gradient comes from
 * the hook (`state.getDisplayColor`), so an alpha slider shows the actual colour fading over a
 * chequerboard rather than a generic grey ramp.
 *
 * The value is announced as what it means — "Hue, 210 degrees", "Alpha, 40%" — because that is
 * what `useColorSlider` formats it as, in the locale. A slider that announces "0.4" has told
 * nobody anything.
 */
export function ColorSlider(props: ColorSliderProps) {
  const { slots } = useComponentConfig('ColorSlider');
  const {
    channel,
    orientation = 'horizontal',
    label,
    showValue = true,
    disabled,
    className,
    classNames,
    style,
    ...rest
  } = props;

  const { locale } = useLocale();
  const state = useColorSliderState({ ...rest, channel, orientation, isDisabled: disabled, locale });
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { trackProps, thumbProps, inputProps, labelProps, outputProps } = useColorSlider(
    { ...rest, channel, orientation, isDisabled: disabled, label: typeof label === 'string' ? label : undefined, trackRef, inputRef },
    state,
  );
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name: ColorSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  return (
    <div
      className={slot('root', 'grange-color-slider', styles.slider)}
      style={style}
      data-orientation={orientation}
      data-disabled={disabled || undefined}
    >
      {(label != null || showValue) && (
        <div className={styles.sliderHeader}>
          <label {...labelProps}>{label ?? state.value.getChannelName(channel, locale)}</label>
          {showValue && <output {...outputProps}>{state.value.formatChannelValue(channel, locale)}</output>}
        </div>
      )}

      {/*
        The hook puts the channel's gradient in `trackProps.style.background`. It is lifted off
        the track and onto a layer inside it so a chequerboard can sit underneath: without one,
        a half-transparent alpha track fades into whatever the page happens to be, and reads as
        a pale version of the colour rather than as transparency.
      */}
      <div
        {...trackProps}
        ref={trackRef}
        className={slot('track', 'grange-color-slider-track', styles.track)}
        style={{ ...trackProps.style, background: undefined }}
        data-orientation={orientation}
      >
        <span className={styles.checker} aria-hidden="true" />
        <span className={styles.gradient} style={{ background: trackProps.style?.background }} aria-hidden="true" />
        <div
          {...thumbProps}
          className={slot('thumb', 'grange-color-slider-thumb', styles.thumb)}
          style={{ ...thumbProps.style, background: state.getDisplayColor().toString('css') }}
          data-focus-visible={isFocusVisible || undefined}
        >
          <VisuallyHidden>
            <input ref={inputRef} {...inputProps} {...focusProps} />
          </VisuallyHidden>
        </div>
      </div>
    </div>
  );
}

export const colorSliderThickness = spec.trackSize;
