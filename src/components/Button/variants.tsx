/**
 * One component per variant, the way Material Web ships one custom element per variant
 * (`md-filled-button`, `md-outlined-button`, ...) and Compose ships one composable each.
 *
 * Picking a variant this way cannot go wrong: there is no prop to misspell and no way to ask for
 * two at once. `Button` and `IconButton` keep their `variant` prop for the case these cannot
 * cover, a variant chosen at runtime.
 *
 * Material Web has no size scale, since M3 Expressive's five sizes are not in its stable
 * release, so `size` and `shape` stay props here.
 */
import { forwardRef } from 'react';
import { Button, IconButton, type ButtonProps, type IconButtonProps } from './Button';
import type { GrangeButtonElement } from '../ButtonBase/ButtonBase';

export type VariantButtonProps = Omit<ButtonProps, 'variant'>;
export type VariantIconButtonProps = Omit<IconButtonProps, 'variant'>;

/** The high-emphasis button, for the single most important action on a screen. `md-filled-button`. */
export const FilledButton = forwardRef<GrangeButtonElement, VariantButtonProps>(
  function FilledButton(props, ref) {
    return <Button {...props} ref={ref} variant="filled" />;
  },
);

/** A quieter filled button, for an action that matters but is not the primary one. `md-filled-tonal-button`. */
export const FilledTonalButton = forwardRef<GrangeButtonElement, VariantButtonProps>(
  function FilledTonalButton(props, ref) {
    return <Button {...props} ref={ref} variant="tonal" />;
  },
);

/** Outlined, for a secondary action that still needs a clear boundary. `md-outlined-button`. */
export const OutlinedButton = forwardRef<GrangeButtonElement, VariantButtonProps>(
  function OutlinedButton(props, ref) {
    return <Button {...props} ref={ref} variant="outlined" />;
  },
);

/** Carries a shadow, for a button that must separate from a busy surface. `md-elevated-button`. */
export const ElevatedButton = forwardRef<GrangeButtonElement, VariantButtonProps>(
  function ElevatedButton(props, ref) {
    return <Button {...props} ref={ref} variant="elevated" />;
  },
);

/** The lowest emphasis, for actions in dialogs and cards. `md-text-button`. */
export const TextButton = forwardRef<GrangeButtonElement, VariantButtonProps>(
  function TextButton(props, ref) {
    return <Button {...props} ref={ref} variant="text" />;
  },
);

/** `md-filled-icon-button`. */
export const FilledIconButton = forwardRef<GrangeButtonElement, VariantIconButtonProps>(
  function FilledIconButton(props, ref) {
    return <IconButton {...props} ref={ref} variant="filled" />;
  },
);

/** `md-filled-tonal-icon-button`. */
export const FilledTonalIconButton = forwardRef<GrangeButtonElement, VariantIconButtonProps>(
  function FilledTonalIconButton(props, ref) {
    return <IconButton {...props} ref={ref} variant="tonal" />;
  },
);

/** `md-outlined-icon-button`. */
export const OutlinedIconButton = forwardRef<GrangeButtonElement, VariantIconButtonProps>(
  function OutlinedIconButton(props, ref) {
    return <IconButton {...props} ref={ref} variant="outlined" />;
  },
);
