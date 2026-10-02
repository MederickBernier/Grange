import './tokens/generated/tokens.css';
import './primitives/primitives.scss';

export { GrangeProvider, useSpring, useMotionScheme, toMotionDamping } from './motion/GrangeProvider';
export type { GrangeProviderProps, SpringSpec } from './motion/GrangeProvider';

export { Button, ToggleButton, IconButton } from './components/Button/Button';
export {
  FilledButton,
  FilledTonalButton,
  OutlinedButton,
  ElevatedButton,
  TextButton,
  FilledIconButton,
  FilledTonalIconButton,
  OutlinedIconButton,
} from './components/Button/variants';
export type { VariantButtonProps, VariantIconButtonProps } from './components/Button/variants';

export type {
  ButtonProps,
  ToggleButtonProps,
  IconButtonProps,
  ButtonVariant,
  ToggleButtonVariant,
  IconButtonVariant,
} from './components/Button/Button';
export type {
  ButtonSize,
  ButtonShape,
  IconButtonWidth,
  ButtonSizeSpec,
  SizeOverrides,
  ResolvedSizes,
} from './components/Button/specs';
export { buttonSizes, iconButtonPadding, iconButtonIconSize, resolveSizes } from './components/Button/specs';

export { useGrangeConfig, defaultBehavior } from './config/config';
export type {
  GrangeConfigInput,
  ResolvedConfig,
  ClassOverride,
  SlotOverrides,
  ButtonSlot,
  IconButtonSlot,
  GroupSlot,
  IconSlot,
  DividerSlot,
  ProgressSlot,
  ClassNamesConfig,
  DefaultPropsConfig,
  BehaviorConfig,
  BehaviorInput,
  RippleBehavior,
  SpringRoles,
} from './config/config';

export { Fab } from './components/Fab/Fab';
export type { FabProps, FabSize, FabVariant } from './components/Fab/Fab';
export { fabSizes } from './components/Fab/specs';

export { SplitButton, SplitButtonLeading, SplitButtonTrailing } from './components/SplitButton/SplitButton';
export type {
  SplitButtonProps,
  SplitButtonLeadingProps,
  SplitButtonTrailingProps,
} from './components/SplitButton/SplitButton';
export { splitButtonSizes } from './components/SplitButton/specs';
export type { SplitButtonSizeSpec } from './components/SplitButton/specs';

export { LinearProgress } from './components/Progress/LinearProgress';
export type { LinearProgressProps } from './components/Progress/LinearProgress';
export { CircularProgress } from './components/Progress/CircularProgress';
export type { CircularProgressProps } from './components/Progress/CircularProgress';
export { linearProgress, circularProgress } from './components/Progress/specs';
export { linearWavePath, circularWavePath } from './components/Progress/wave';

export { Icon } from './components/Icon/Icon';
export type { IconProps } from './components/Icon/Icon';
export { Divider } from './components/Divider/Divider';
export type { DividerProps } from './components/Divider/Divider';

export { ButtonGroup, ConnectedButtonGroup, ConnectedButtonGroupItem } from './components/ButtonGroup/ButtonGroup';
export type {
  ButtonGroupProps,
  ConnectedButtonGroupProps,
  ConnectedButtonGroupItemProps,
} from './components/ButtonGroup/ButtonGroup';

export { Ripple } from './primitives/Ripple';
export type { RippleHandle } from './primitives/Ripple';
export { ButtonBase, uniform } from './components/ButtonBase/ButtonBase';
export type { ButtonBaseProps, CornerRadii, GrangeButtonElement } from './components/ButtonBase/ButtonBase';

export * as tokens from './tokens/generated/tokens';
