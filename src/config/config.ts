/**
 * Everything a product can change about the components without forking them: the classes they
 * carry, the props they default to, how they behave, and their geometry.
 *
 * Colors, corners and typefaces are not here. Those are CSS custom properties, overridden in
 * CSS where the cascade can scope them to a subtree (see src/scss/_api.scss).
 */
import { createContext, useContext } from 'react';
import type { MotionSchemeName, SpringName } from '../tokens/generated/tokens';
import type {
  ButtonShape,
  ButtonSize,
  ButtonVariant,
  IconButtonVariant,
  IconButtonWidth,
  ResolvedSizes,
  SizeOverrides,
  ToggleButtonVariant,
} from '../components/Button/specs';
import { defaultSizes, resolveSizes } from '../components/Button/specs';
import type { ExtendedFabSize, FabSize, FabVariant } from '../components/Fab/specs';
import type { AvatarColor, AvatarShape, AvatarSize } from '../components/Avatar/specs';
import type { SkeletonAnimation, SkeletonShape } from '../components/Skeleton/specs';
import type { AccordionVariant } from '../components/Disclosure/specs';

/** A spring as M3 defines it: stiffness plus damping ratio (1 = no overshoot). */
export interface SpringSpec {
  stiffness: number;
  dampingRatio: number;
}

// ---------------------------------------------------------------------------
// Class names
// ---------------------------------------------------------------------------

/**
 * A class override. A string is added to what the component already carries; `{ replace }`
 * drops everything set before it, for teams restyling a slot from scratch.
 *
 * The stable hook class (`grange-button`, `grange-button-label`, ...) is never dropped: it
 * carries no styles, it is only there so CSS and tests can find the element.
 *
 * `replace` accepts undefined, which clears the slot, so a CSS Modules lookup can be passed
 * straight through under `noUncheckedIndexedAccess`.
 */
export type ClassOverride = string | { replace: string | undefined };

export type ButtonSlot = 'root' | 'label' | 'icon';
export type IconButtonSlot = 'root' | 'icon';
export type GroupSlot = 'root';
export type IconSlot = 'root';
export type ProgressSlot = 'root' | 'track' | 'active';
export type CheckboxSlot = 'root' | 'box' | 'label';
export type SwitchSlot = 'root' | 'track' | 'handle' | 'label';
export type RadioSlot = 'root' | 'ring' | 'label';
export type RatingSlot = 'root' | 'label' | 'item';
export type SignatureSlot = 'root' | 'label' | 'surface' | 'actions';
export type FormSlot = 'root' | 'actions';
export type SliderSlot = 'root' | 'track' | 'handle' | 'label';
export type TextFieldSlot =
  | 'root'
  | 'container'
  | 'label'
  | 'input'
  | 'supporting'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'reveal';
export type NumberFieldSlot =
  | 'root'
  | 'container'
  | 'label'
  | 'input'
  | 'supporting'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'stepper';
export type DividerSlot = 'root';
export type DialogSlot = 'root' | 'scrim' | 'headline' | 'content' | 'actions' | 'icon';
export type TooltipSlot = 'root';
export type RichTooltipSlot = 'root' | 'subhead' | 'content' | 'actions';
export type MenuSlot = 'root' | 'item';
export type SelectSlot = 'root' | 'trigger' | 'label' | 'item';
export type ComboBoxSlot =
  | 'root'
  | 'container'
  | 'label'
  | 'input'
  | 'supporting'
  | 'leadingIcon'
  | 'item';
export type PopoverSlot = 'root';
export type MultiSelectSlot =
  | 'root'
  | 'container'
  | 'label'
  | 'supporting'
  | 'leadingIcon'
  | 'tag'
  | 'item';
export type TabsSlot = 'root' | 'list' | 'tab' | 'panel';
export type CardSlot = 'root';
export type ListSlot = 'root' | 'item' | 'label';
export type SelectableListSlot = 'root' | 'item' | 'label';
export type AppBarSlot = 'root' | 'title' | 'subtitle' | 'leading' | 'actions';
export type NavigationSlot = 'root';
export type DrawerSlot = 'root' | 'scrim';
export type BottomSheetSlot = 'root' | 'scrim' | 'handle';
export type SideSheetSlot = 'root' | 'scrim' | 'header' | 'headline' | 'content' | 'actions' | 'handle';
export type CarouselSlot = 'root' | 'item';
export type AvatarSlot = 'root' | 'image' | 'label';
export type DisclosureSlot = 'root' | 'header' | 'title' | 'panel';
export type BreadcrumbsSlot = 'root' | 'crumb';
export type TimelineSlot = 'root' | 'item' | 'content';
export type SplitterSlot = 'root' | 'pane' | 'bar';
export type WindowSlot = 'root' | 'bar' | 'body';
export type TileLayoutSlot = 'root' | 'tile' | 'header' | 'body';
export type TreeSlot = 'root' | 'row' | 'label';
export type PagerSlot = 'root' | 'summary' | 'page';
export type TransferListSlot = 'root' | 'list';
export type StepperSlot = 'root' | 'step' | 'button';
export type SkeletonSlot = 'root' | 'bar';
export type BadgeSlot = 'root';
export type ChipSlot = 'root' | 'label' | 'remove';
export type SearchSlot = 'root' | 'bar' | 'input' | 'view';
export type CalendarSlot = 'root' | 'header' | 'cell';
export type TimeFieldSlot = 'root' | 'input' | 'label';
export type DateFieldSlot =
  | 'root'
  | 'container'
  | 'label'
  | 'input'
  | 'supporting'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'calendarButton';
export type TimePickerSlot = 'root' | 'headline' | 'hour' | 'minute' | 'period' | 'dial';
export type SnackbarSlot = 'root' | 'region' | 'action';

export type SlotOverrides<Slot extends string> = Partial<Record<Slot, ClassOverride>>;

export interface ClassNamesConfig {
  Button?: SlotOverrides<ButtonSlot>;
  ToggleButton?: SlotOverrides<ButtonSlot>;
  IconButton?: SlotOverrides<IconButtonSlot>;
  ButtonGroup?: SlotOverrides<GroupSlot>;
  ConnectedButtonGroup?: SlotOverrides<GroupSlot>;
  ConnectedButtonGroupItem?: SlotOverrides<ButtonSlot>;
  Icon?: SlotOverrides<IconSlot>;
  Divider?: SlotOverrides<DividerSlot>;
  Fab?: SlotOverrides<IconButtonSlot>;
  ExtendedFab?: SlotOverrides<ButtonSlot>;
  FabMenu?: SlotOverrides<GroupSlot>;
  FabMenuItem?: SlotOverrides<ButtonSlot>;
  SplitButton?: SlotOverrides<GroupSlot>;
  SplitButtonLeading?: SlotOverrides<ButtonSlot>;
  SplitButtonTrailing?: SlotOverrides<IconButtonSlot>;
  FloatingToolbar?: SlotOverrides<GroupSlot>;
  DockedToolbar?: SlotOverrides<GroupSlot>;
  Checkbox?: SlotOverrides<CheckboxSlot>;
  Switch?: SlotOverrides<SwitchSlot>;
  RadioGroup?: SlotOverrides<'root' | 'label'>;
  Radio?: SlotOverrides<RadioSlot>;
  Rating?: SlotOverrides<RatingSlot>;
  Signature?: SlotOverrides<SignatureSlot>;
  Form?: SlotOverrides<FormSlot>;
  FormField?: SlotOverrides<'root' | 'label' | 'supporting'>;
  Slider?: SlotOverrides<SliderSlot>;
  TextField?: SlotOverrides<TextFieldSlot>;
  NumberField?: SlotOverrides<NumberFieldSlot>;
  Dialog?: SlotOverrides<DialogSlot>;
  Tooltip?: SlotOverrides<TooltipSlot>;
  RichTooltip?: SlotOverrides<RichTooltipSlot>;
  Menu?: SlotOverrides<MenuSlot>;
  Select?: SlotOverrides<SelectSlot>;
  ComboBox?: SlotOverrides<ComboBoxSlot>;
  MultiSelect?: SlotOverrides<MultiSelectSlot>;
  Popover?: SlotOverrides<PopoverSlot>;
  Tabs?: SlotOverrides<TabsSlot>;
  Card?: SlotOverrides<CardSlot>;
  List?: SlotOverrides<ListSlot>;
  ListItem?: SlotOverrides<ListSlot>;
  SelectableList?: SlotOverrides<SelectableListSlot>;
  AppBar?: SlotOverrides<AppBarSlot>;
  NavigationBar?: SlotOverrides<NavigationSlot>;
  NavigationRail?: SlotOverrides<NavigationSlot>;
  NavigationDrawer?: SlotOverrides<DrawerSlot>;
  BottomSheet?: SlotOverrides<BottomSheetSlot>;
  SideSheet?: SlotOverrides<SideSheetSlot>;
  Carousel?: SlotOverrides<CarouselSlot>;
  CarouselItem?: SlotOverrides<CarouselSlot>;
  Avatar?: SlotOverrides<AvatarSlot>;
  ExpansionPanel?: SlotOverrides<DisclosureSlot>;
  Accordion?: SlotOverrides<DisclosureSlot>;
  Breadcrumbs?: SlotOverrides<BreadcrumbsSlot>;
  Stack?: SlotOverrides<'root'>;
  Grid?: SlotOverrides<'root'>;
  Timeline?: SlotOverrides<TimelineSlot>;
  Splitter?: SlotOverrides<SplitterSlot>;
  Window?: SlotOverrides<WindowSlot>;
  TileLayout?: SlotOverrides<TileLayoutSlot>;
  TreeView?: SlotOverrides<TreeSlot>;
  DropDownTree?: SlotOverrides<SelectSlot>;
  Pager?: SlotOverrides<PagerSlot>;
  TransferList?: SlotOverrides<TransferListSlot>;
  Stepper?: SlotOverrides<StepperSlot>;
  Skeleton?: SlotOverrides<SkeletonSlot>;
  Badge?: SlotOverrides<BadgeSlot>;
  Chip?: SlotOverrides<ChipSlot>;
  ChipGroup?: SlotOverrides<'root'>;
  Search?: SlotOverrides<SearchSlot>;
  LoadingIndicator?: SlotOverrides<'root'>;
  Calendar?: SlotOverrides<CalendarSlot>;
  TimeField?: SlotOverrides<TimeFieldSlot>;
  DateField?: SlotOverrides<DateFieldSlot>;
  DatePicker?: SlotOverrides<DateFieldSlot>;
  DateRangePicker?: SlotOverrides<DateFieldSlot>;
  TimePicker?: SlotOverrides<TimePickerSlot>;
  CheckboxGroup?: SlotOverrides<'root' | 'label' | 'supportingText'>;
  Snackbar?: SlotOverrides<SnackbarSlot>;
  LinearProgress?: SlotOverrides<ProgressSlot>;
  CircularProgress?: SlotOverrides<ProgressSlot>;
}

export type ComponentName = keyof ClassNamesConfig;

/** Providers stack rather than shadow, so an inner provider adds to an outer one. */
type SlotLayers = Partial<Record<string, ClassOverride[]>>;
export type ClassNameLayers = Partial<Record<ComponentName, SlotLayers>>;

/**
 * Resolves one slot's class. Layers apply in order (outer provider, inner provider, instance);
 * each either appends or, with `{ replace }`, discards what came before it.
 */
export function resolveSlotClass(
  hook: string,
  builtIn: string | undefined,
  ...layers: Array<ClassOverride | undefined>
): string {
  let classes = builtIn ? [builtIn] : [];
  for (const layer of layers) {
    if (layer === undefined) continue;
    if (typeof layer === 'string') {
      if (layer) classes.push(layer);
    } else {
      classes = layer.replace ? [layer.replace] : [];
    }
  }
  return [hook, ...classes].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

/** What a bare <Button> means in this app. Props passed at a call site still win. */
export interface DefaultPropsConfig {
  Button?: { variant?: ButtonVariant; size?: ButtonSize; shape?: ButtonShape };
  ToggleButton?: { variant?: ToggleButtonVariant; size?: ButtonSize; shape?: ButtonShape };
  IconButton?: {
    variant?: IconButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    width?: IconButtonWidth;
  };
  ButtonGroup?: { gap?: number; expandedRatio?: number };
  ConnectedButtonGroup?: {
    size?: ButtonSize;
    variant?: ToggleButtonVariant;
    selectionMode?: 'single' | 'multiple';
    disallowEmptySelection?: boolean;
    fullWidth?: boolean;
  };
  Icon?: { size?: number };
  Divider?: { inset?: boolean | 'start' | 'end' };
  Fab?: { size?: FabSize; variant?: FabVariant };
  ExtendedFab?: { size?: ExtendedFabSize; variant?: FabVariant; lowered?: boolean };
  FabMenu?: { variant?: FabVariant };
  SplitButton?: { size?: ButtonSize; variant?: ToggleButtonVariant };
  FloatingToolbar?: {
    variant?: 'standard' | 'vibrant';
    orientation?: 'horizontal' | 'vertical';
  };
  RadioGroup?: { orientation?: 'horizontal' | 'vertical' };
  CheckboxGroup?: { orientation?: 'horizontal' | 'vertical' };
  Rating?: { max?: number; precision?: 1 | 0.5; allowClear?: boolean };
  Signature?: { width?: number; height?: number; strokeWidth?: number };
  Form?: { validationBehavior?: 'aria' | 'native' };
  DateField?: { variant?: 'filled' | 'outlined' };
  Avatar?: { size?: AvatarSize; shape?: AvatarShape; color?: AvatarColor };
  ExpansionPanel?: { variant?: AccordionVariant };
  Accordion?: { variant?: AccordionVariant; allowsMultipleExpanded?: boolean };
  Breadcrumbs?: { maxVisible?: number };
  Stack?: { direction?: 'row' | 'column'; gap?: string | number };
  Grid?: { columns?: number | string; gap?: string | number };
  Timeline?: { orientation?: 'vertical' | 'horizontal'; alternating?: boolean };
  Splitter?: { orientation?: 'horizontal' | 'vertical' };
  Window?: { minimizable?: boolean; maximizable?: boolean; resizable?: boolean; closable?: boolean };
  TreeView?: { selectionMode?: 'none' | 'single' | 'multiple' };
  DropDownTree?: { variant?: 'filled' | 'outlined'; selectionMode?: 'single' | 'multiple' };
  Pager?: { pageSize?: number; pageSizes?: readonly number[]; numbers?: boolean };
  TransferList?: { allowMoveAll?: boolean };
  TileLayout?: {
    columns?: number;
    gap?: string | number;
    rowHeight?: number;
    reorderable?: boolean;
    resizable?: boolean;
  };
  Stepper?: { orientation?: 'horizontal' | 'vertical'; linear?: boolean };
  Skeleton?: { shape?: SkeletonShape; animation?: SkeletonAnimation };
  DatePicker?: { variant?: 'filled' | 'outlined' };
  DateRangePicker?: { variant?: 'filled' | 'outlined'; visibleMonths?: 1 | 2 | 3 };
  TimePicker?: {
    hourCycle?: 12 | 24;
    periodOrientation?: 'vertical' | 'horizontal';
    mode?: 'dial' | 'input';
  };
  TextField?: { variant?: 'filled' | 'outlined' };
  NumberField?: { variant?: 'filled' | 'outlined'; hideStepper?: boolean };
  Select?: { variant?: 'filled' | 'outlined' };
  ComboBox?: {
    variant?: 'filled' | 'outlined';
    allowsCustomValue?: boolean;
    menuTrigger?: 'input' | 'focus' | 'manual';
    showOpenButton?: boolean;
  };
  MultiSelect?: { variant?: 'filled' | 'outlined' };
  Popover?: { placement?: 'top' | 'bottom' | 'start' | 'end'; nonModal?: boolean };
  Menu?: { variant?: 'default' | 'standard' | 'vibrant' };
  RichTooltip?: { placement?: 'top' | 'bottom' | 'start' | 'end'; persistent?: boolean };
  Tabs?: { variant?: 'primary' | 'secondary'; scrollable?: boolean };
  Card?: { variant?: 'elevated' | 'filled' | 'outlined' };
  SelectableList?: { orientation?: 'vertical' | 'horizontal'; selectionMode?: 'single' | 'multiple' };
  AppBar?: {
    size?: 'small' | 'medium' | 'large' | 'mediumFlexible' | 'largeFlexible';
    centered?: boolean;
  };
  NavigationBar?: { arrangement?: 'vertical' | 'horizontal'; tall?: boolean };
  NavigationRail?: { expanded?: boolean; narrow?: boolean };
  NavigationDrawer?: { modal?: boolean; placement?: 'start' | 'end' };
  BottomSheet?: { modal?: boolean };
  SideSheet?: { modal?: boolean; placement?: 'start' | 'end' };
  Carousel?: { variant?: 'multi-browse' | 'uncontained' | 'hero' | 'full-screen' };
  Chip?: { variant?: 'assist' | 'filter' | 'input' | 'suggestion'; elevated?: boolean };
  LinearProgress?: { wavy?: boolean };
  CircularProgress?: { wavy?: boolean };
}

// ---------------------------------------------------------------------------
// Behavior
// ---------------------------------------------------------------------------

/** Ripple timings, from Material Web (Apache 2.0, see NOTICE). */
export interface RippleBehavior {
  /** Off means pointer presses fall back to the pressed state layer, as keyboard presses do. */
  enabled: boolean;
  growMs: number;
  minimumPressMs: number;
  fadeOutMs: number;
  initialOriginScale: number;
  padding: number;
  softEdgeMinimumSize: number;
  softEdgeContainerRatio: number;
  easing: string;
}

/** Which spring drives each interaction. Retuning a spring is `springOverrides`; this reassigns. */
export interface SpringRoles {
  /** Corner morph while pressed. Compose deliberately avoids bounce here. */
  press: SpringName;
  /** Shape swap when a toggle or a connected item becomes selected. */
  selection: SpringName;
  /** A button group item widening and its neighbours making room. */
  groupWidth: SpringName;
}

export interface BehaviorConfig {
  ripple: RippleBehavior;
  springs: SpringRoles;
  /** Adds the invisible 48px touch target to anything shorter than this, in px. */
  touchTargetBelow: number;
  /** Connected group inner corners, resting and pressed, in px. */
  connectedInnerCorner: number;
  connectedInnerCornerPressed: number;
}

export interface BehaviorInput {
  ripple?: Partial<RippleBehavior>;
  springs?: Partial<SpringRoles>;
  touchTargetBelow?: number;
  connectedInnerCorner?: number;
  connectedInnerCornerPressed?: number;
}

export const defaultBehavior: BehaviorConfig = {
  ripple: {
    enabled: true,
    growMs: 450,
    minimumPressMs: 225,
    fadeOutMs: 375,
    initialOriginScale: 0.2,
    padding: 10,
    softEdgeMinimumSize: 75,
    softEdgeContainerRatio: 0.35,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  springs: { press: 'defaultEffects', selection: 'fastSpatial', groupWidth: 'fastSpatial' },
  touchTargetBelow: 48,
  connectedInnerCorner: 8,
  connectedInnerCornerPressed: 4,
};

// ---------------------------------------------------------------------------
// The config itself
// ---------------------------------------------------------------------------

/** What GrangeProvider accepts. Every field is optional and merges onto any outer provider. */
export interface GrangeConfigInput {
  scheme?: MotionSchemeName;
  /**
   * Where overlays are portalled. Defaults to the document body. Set it to render dialogs,
   * menus and tooltips inside a particular subtree, which a modal host or an embedded widget
   * needs so the overlay lands in the right stacking and style context.
   */
  portalContainer?: Element | null;
  springOverrides?: Partial<Record<SpringName, SpringSpec>>;
  defaultProps?: DefaultPropsConfig;
  classNames?: ClassNamesConfig;
  behavior?: BehaviorInput;
  sizes?: SizeOverrides;
}

export interface ResolvedConfig {
  scheme: MotionSchemeName;
  portalContainer?: Element | null;
  springOverrides?: Partial<Record<SpringName, SpringSpec>>;
  defaultProps: DefaultPropsConfig;
  classNames: ClassNameLayers;
  behavior: BehaviorConfig;
  sizes: ResolvedSizes;
}

export const defaultConfig: ResolvedConfig = {
  scheme: 'expressive',
  defaultProps: {},
  classNames: {},
  behavior: defaultBehavior,
  sizes: defaultSizes,
};

const COMPONENTS: ComponentName[] = [
  'Button',
  'ToggleButton',
  'IconButton',
  'ButtonGroup',
  'ConnectedButtonGroup',
  'ConnectedButtonGroupItem',
  'Icon',
  'Divider',
  'Fab',
  'ExtendedFab',
  'FabMenu',
  'FabMenuItem',
  'SplitButton',
  'SplitButtonLeading',
  'SplitButtonTrailing',
  'Checkbox',
  'Switch',
  'RadioGroup',
  'Radio',
  'Rating',
  'Signature',
  'Form',
  'FormField',
  'Slider',
  'TextField',
  'NumberField',
  'FloatingToolbar',
  'DockedToolbar',
  'LinearProgress',
  'CircularProgress',
  'Dialog',
  'Tooltip',
  'RichTooltip',
  'Menu',
  'Select',
  'ComboBox',
  'MultiSelect',
  'Popover',
  'Snackbar',
  'Tabs',
  'Card',
  'List',
  'ListItem',
  'SelectableList',
  'AppBar',
  'NavigationBar',
  'NavigationRail',
  'NavigationDrawer',
  'BottomSheet',
  'SideSheet',
  'Carousel',
  'CarouselItem',
  'Avatar',
  'ExpansionPanel',
  'Accordion',
  'Breadcrumbs',
  'Stack',
  'Grid',
  'Timeline',
  'Splitter',
  'Window',
  'TileLayout',
  'TreeView',
  'DropDownTree',
  'Pager',
  'TransferList',
  'Stepper',
  'Skeleton',
  'Badge',
  'Chip',
  'ChipGroup',
  'Search',
  'LoadingIndicator',
  'Calendar',
  'TimeField',
  'DateField',
  'DatePicker',
  'DateRangePicker',
  'TimePicker',
  'CheckboxGroup',
];

/**
 * Folds one provider's input onto the config it is nested in. Scalars and props override;
 * class name overrides stack, so an inner provider adds a layer rather than replacing the outer.
 */
export function mergeConfig(parent: ResolvedConfig, input: GrangeConfigInput): ResolvedConfig {
  const defaultProps: DefaultPropsConfig = { ...parent.defaultProps };
  for (const name of COMPONENTS) {
    const incoming = input.defaultProps?.[name as keyof DefaultPropsConfig];
    if (incoming) {
      (defaultProps as Record<string, unknown>)[name] = { ...(parent.defaultProps as Record<string, object>)[name], ...incoming };
    }
  }

  const classNames: ClassNameLayers = { ...parent.classNames };
  for (const name of COMPONENTS) {
    const incoming = input.classNames?.[name];
    if (!incoming) continue;
    const slots: SlotLayers = { ...parent.classNames[name] };
    for (const [slot, override] of Object.entries(incoming)) {
      if (override === undefined) continue;
      slots[slot] = [...(slots[slot] ?? []), override];
    }
    classNames[name] = slots;
  }

  return {
    scheme: input.scheme ?? parent.scheme,
    portalContainer: input.portalContainer ?? parent.portalContainer,
    springOverrides:
      input.springOverrides || parent.springOverrides
        ? { ...parent.springOverrides, ...input.springOverrides }
        : undefined,
    defaultProps,
    classNames,
    behavior: {
      ripple: { ...parent.behavior.ripple, ...input.behavior?.ripple },
      springs: { ...parent.behavior.springs, ...input.behavior?.springs },
      touchTargetBelow: input.behavior?.touchTargetBelow ?? parent.behavior.touchTargetBelow,
      connectedInnerCorner: input.behavior?.connectedInnerCorner ?? parent.behavior.connectedInnerCorner,
      connectedInnerCornerPressed:
        input.behavior?.connectedInnerCornerPressed ?? parent.behavior.connectedInnerCornerPressed,
    },
    sizes: resolveSizes(input.sizes, parent.sizes),
  };
}

/**
 * Every component that takes class overrides. Exported so a test can check it against
 * ClassNamesConfig: a component missing from here still typechecks but silently ignores its
 * overrides, which is how `Dialog` and `Tooltip` first shipped.
 */
export const configuredComponents: readonly ComponentName[] = COMPONENTS;

export const GrangeConfigContext = createContext<ResolvedConfig>(defaultConfig);

/** The resolved config at this point in the tree. Works outside a provider, with the defaults. */
export function useGrangeConfig(): ResolvedConfig {
  return useContext(GrangeConfigContext);
}

/**
 * Configurable defaults for one component. ConnectedButtonGroupItem has none of its own: it
 * takes its size and variant from the group around it.
 */
export type DefaultsFor<Name extends ComponentName> = Name extends keyof DefaultPropsConfig
  ? DefaultPropsConfig[Name]
  : undefined;

/** The slice one component needs: its defaults and its class name layers. */
export function useComponentConfig<Name extends ComponentName>(name: Name) {
  const config = useGrangeConfig();
  const defaultProps = config.defaultProps as Partial<Record<ComponentName, unknown>>;
  return {
    defaults: defaultProps[name] as DefaultsFor<Name>,
    slots: config.classNames[name],
    behavior: config.behavior,
    sizes: config.sizes,
  };
}
