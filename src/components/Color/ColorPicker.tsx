import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useButton, useColorSwatch, useFocusRing, useHover } from 'react-aria';
import { useColorPickerState, useOverlayTriggerState, type Color as AriaColor } from 'react-stately';
import { Popover } from '../../overlays/Popover';
import { ColorArea } from './ColorArea';
import { ColorField } from './ColorField';
import { ColorSlider } from './ColorSlider';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import {
  resolveSlotClass,
  useComponentConfig,
  type ColorSlot,
  type SlotOverrides,
} from '../../config/config';
import menuStyles from '../Menu/Menu.module.scss';
import styles from './Color.module.scss';

export interface ColorPickerProps {
  value?: string | AriaColor;
  defaultValue?: string | AriaColor;
  onChange?: (value: AriaColor) => void;
  /** The trigger's label, which also names the panel. */
  label?: ReactNode;
  /** An alpha slider under the hue one. */
  showAlpha?: boolean;
  /** The hex field under the sliders. */
  showField?: boolean;
  /** A row of preset colours under everything else. */
  presets?: readonly string[];
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<ColorSlot>;
}

/**
 * A colour, behind a swatch that opens a panel.
 *
 * Nothing new is drawn here: it is `ColorArea`, `ColorSlider`, `ColorField` and
 * `ColorSwatchPicker` wired to one `useColorPickerState`, inside the shared `Popover`. That is
 * the whole reason the pieces were built first — a picker assembled from them cannot disagree
 * with a picker someone assembles themselves.
 *
 * **The value is kept in HSB inside the panel and reported in the caller's own format.** A
 * picker that stores RGB loses the hue the moment the colour reaches black: every dark colour
 * is `rgb(0, 0, 0)`, so dragging brightness down and back up again lands on red. Keeping HSB
 * means the hue survives a trip to the bottom of the square, which is what anyone dragging it
 * expects.
 *
 * The trigger is named by the colour, through `useColorSwatch` — "Colour, dark grayish cyan
 * blue" — rather than by a hex code nobody can hear.
 */
export function ColorPicker(props: ColorPickerProps) {
  const { defaults, slots } = useComponentConfig('ColorPicker');
  const {
    value,
    defaultValue = '#6750A4',
    onChange,
    label,
    showAlpha = defaults?.showAlpha ?? false,
    showField = defaults?.showField ?? true,
    presets,
    disabled,
    open,
    defaultOpen,
    onOpenChange,
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const state = useColorPickerState({ value, defaultValue, onChange });
  const overlay = useOverlayTriggerState({ isOpen: open, defaultOpen, onOpenChange });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const { colorSwatchProps, color } = useColorSwatch({ color: state.color });
  const name = (colorSwatchProps as { 'aria-label'?: string })['aria-label'];
  const { buttonProps } = useButton(
    {
      isDisabled: disabled,
      onPress: () => overlay.toggle(),
      'aria-label': [ariaLabel ?? (typeof label === 'string' ? label : 'Colour'), name]
        .filter(Boolean)
        .join(', '),
      'aria-haspopup': 'dialog',
      'aria-expanded': overlay.isOpen,
    },
    triggerRef,
  );
  const { hoverProps, isHovered } = useHover({ isDisabled: disabled });
  const { focusProps, isFocusVisible } = useFocusRing();

  const slot = (name_: ColorSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name_] ?? []), classNames?.[name_], name_ === 'root' ? className : undefined);

  return (
    <div className={slot('root', 'grange-color-picker', styles.picker)} style={style}>
      {label != null && <span className={styles.pickerLabel}>{label}</span>}

      <button
        {...buttonProps}
        {...hoverProps}
        {...focusProps}
        ref={triggerRef}
        className={styles.trigger}
        data-hovered={isHovered || undefined}
        data-focus-visible={isFocusVisible || undefined}
      >
        <span className={styles.triggerColor} style={{ background: color.toString('css') }} aria-hidden="true" />
      </button>

      {overlay.isOpen && (
        <Popover state={overlay} triggerRef={triggerRef} className={menuStyles.popover}>
          <div className={styles.panel} role="group" aria-label={typeof label === 'string' ? label : 'Colour'}>
            <Panel state={state} showAlpha={showAlpha} showField={showField} presets={presets} />
          </div>
        </Popover>
      )}
    </div>
  );
}

/**
 * The panel on its own — the catalog's FlatColorPicker.
 *
 * The same controls without the trigger, for a picker that lives on the page rather than in a
 * popover. It is the same component underneath, so the two cannot drift.
 */
export function FlatColorPicker(props: Omit<ColorPickerProps, 'open' | 'defaultOpen' | 'onOpenChange'>) {
  const { defaults } = useComponentConfig('ColorPicker');
  const {
    value,
    defaultValue = '#6750A4',
    onChange,
    label,
    showAlpha = defaults?.showAlpha ?? false,
    showField = defaults?.showField ?? true,
    presets,
    className,
    style,
    'aria-label': ariaLabel,
  } = props;

  const state = useColorPickerState({ value, defaultValue, onChange });

  return (
    <div
      className={resolveSlotClass('grange-color-picker-panel', styles.panel, className)}
      style={style}
      role="group"
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'Colour')}
    >
      <Panel state={state} showAlpha={showAlpha} showField={showField} presets={presets} />
    </div>
  );
}

function Panel({
  state,
  showAlpha,
  showField,
  presets,
}: {
  state: ReturnType<typeof useColorPickerState>;
  showAlpha: boolean;
  showField: boolean;
  presets?: readonly string[];
}) {
  /*
   * HSB inside the panel, whatever the caller's format. In RGB the hue is lost the moment the
   * colour reaches black — every dark colour is rgb(0, 0, 0) — so dragging brightness down and
   * back up would land on red rather than on the hue that was there.
   */
  const hsb = state.color.toFormat('hsb');
  const set = (next: AriaColor) => state.setColor(next);

  return (
    <>
      <ColorArea value={hsb} onChange={set} xChannel="saturation" yChannel="brightness" />
      <ColorSlider channel="hue" value={hsb} onChange={set} />
      {showAlpha && <ColorSlider channel="alpha" value={hsb} onChange={set} />}
      {showField && (
        <ColorField
          aria-label="Hex"
          value={state.color}
          onChange={(next) => next && set(next.toFormat('hsb'))}
        />
      )}
      {presets && presets.length > 0 && (
        <ColorSwatchPicker
          aria-label="Presets"
          colors={presets}
          value={state.color}
          onChange={(next) => set(next.toFormat('hsb'))}
          columns={Math.min(presets.length, 6)}
          size={28}
        />
      )}
    </>
  );
}
