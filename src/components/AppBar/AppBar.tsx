import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { resolveSlotClass, useComponentConfig, type AppBarSlot, type SlotOverrides } from '../../config/config';
import { appBarSizes, type AppBarSize } from './specs';
import styles from './AppBar.module.scss';

export type { AppBarSize };

export interface AppBarProps {
  title?: ReactNode;
  /** A second line under the title. On the flexible sizes it also makes the bar taller. */
  subtitle?: ReactNode;
  /** The navigation control, usually a back arrow or a menu button. */
  leading?: ReactNode;
  /** Trailing controls. */
  actions?: ReactNode;
  size?: AppBarSize;
  /** Centres the title, which the spec allows for the small size only. */
  centered?: boolean;
  /**
   * Switches to the on-scroll colour and elevation, which the tokens publish separately.
   *
   * Driven by the app rather than measured here, because only the app knows which container
   * scrolls; a bar cannot assume it is the window.
   */
  scrolled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<AppBarSlot>;
}

/**
 * A top app bar, in the three classic sizes and the two M3 Expressive flexible ones.
 *
 * The small bar keeps its title inline with the icons; the taller sizes drop it onto its own
 * line below them. The flexible sizes grow when a subtitle is present, which is the one thing
 * they add over medium and large: each publishes two heights.
 */
export const AppBar = forwardRef<HTMLElement, AppBarProps>(function AppBar(props, ref) {
  const { defaults, slots } = useComponentConfig('AppBar');
  const {
    title,
    subtitle,
    leading,
    actions,
    size = defaults?.size ?? 'small',
    centered = defaults?.centered ?? false,
    scrolled,
    className,
    classNames,
    style,
  } = props;

  const spec = appBarSizes[size];
  const height = subtitle != null ? spec.heightWithSubtitle : spec.height;

  const slot = (name: AppBarSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const titleBlock = (
    <span className={styles.titles}>
      {title != null && (
        <span className={slot('title', 'grange-app-bar-title', styles.title)}>{title}</span>
      )}
      {subtitle != null && (
        <span className={slot('subtitle', 'grange-app-bar-subtitle', styles.subtitle)}>{subtitle}</span>
      )}
    </span>
  );

  return (
    <header
      ref={ref}
      className={slot('root', 'grange-app-bar', styles.appBar)}
      style={{ ['--_height' as string]: `${height}px`, ...style }}
      data-size={size}
      data-stacked={spec.stacked || undefined}
      data-centered={centered && !spec.stacked ? 'true' : undefined}
      data-scrolled={scrolled || undefined}
      data-with-subtitle={subtitle != null ? 'true' : undefined}
    >
      <div className={styles.row}>
        <span className={slot('leading', 'grange-app-bar-leading', styles.leading)}>{leading}</span>
        {/* A small bar carries its title in the row; the taller sizes put it below. */}
        {!spec.stacked && titleBlock}
        <span className={slot('actions', 'grange-app-bar-actions', styles.actions)}>{actions}</span>
      </div>
      {spec.stacked && <div className={styles.stackedTitle}>{titleBlock}</div>}
    </header>
  );
});
