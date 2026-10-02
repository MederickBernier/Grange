import './tokens/generated/tokens.css';
import './primitives/primitives.scss';

export { GrangeProvider, useSpring, useMotionScheme, toMotionDamping } from './motion/GrangeProvider';
export type { GrangeProviderProps, SpringSpec } from './motion/GrangeProvider';

export { Button, ToggleButton, IconButton } from './components/Button/Button';
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
  ClassNamesConfig,
  DefaultPropsConfig,
  BehaviorConfig,
  BehaviorInput,
  RippleBehavior,
  SpringRoles,
} from './config/config';

export { ButtonGroup, ConnectedButtonGroup, ConnectedButtonGroupItem } from './components/ButtonGroup/ButtonGroup';
export type {
  ButtonGroupProps,
  ConnectedButtonGroupProps,
  ConnectedButtonGroupItemProps,
} from './components/ButtonGroup/ButtonGroup';

export { Ripple } from './primitives/Ripple';
export type { RippleHandle } from './primitives/Ripple';
export { ButtonBase, uniform } from './components/ButtonBase/ButtonBase';
export type { ButtonBaseProps, CornerRadii } from './components/ButtonBase/ButtonBase';

export * as tokens from './tokens/generated/tokens';
