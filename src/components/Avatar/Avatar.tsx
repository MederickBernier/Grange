import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
  resolveSlotClass,
  useComponentConfig,
  type AvatarSlot,
  type SlotOverrides,
} from '../../config/config';
import type { AvatarColor, AvatarShape, AvatarSize } from './specs';
import styles from './Avatar.module.scss';

export interface AvatarProps {
  /** An image. If it fails to load, the fallback below it is shown instead. */
  src?: string;
  /**
   * The image's alt text. An avatar standing next to the name it belongs to is decoration, so
   * the honest alt is usually `""` — which is the default, and why this is separate from
   * `aria-label`.
   */
  alt?: string;
  /**
   * The fallback: initials, an icon, anything. Shown when there is no `src`, or when the image
   * fails. Initials are not derived from a name here, because initials are not a string
   * operation in most of the world — a caller who knows the name's shape should pass them.
   */
  children?: ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  color?: AvatarColor;
  /**
   * What assistive tech hears. Leave it out when the avatar sits beside the name it belongs to:
   * then the whole thing is hidden, rather than reading the name twice.
   */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<AvatarSlot>;
}

/**
 * A person or thing as a circle: an image, initials, or an icon.
 *
 * Three substantive decisions here.
 *
 * **The image is not load-bearing.** A broken `src` leaves a torn-page icon in most
 * implementations; here the failure is caught and the fallback underneath it takes over, so the
 * avatar always renders as something. The image is also reset when `src` changes, or an avatar
 * whose first URL failed would stay broken after it was given a working one.
 *
 * **Initials are passed in, not derived.** "Mary-Jane O'Hara" and "李小龍" do not share a rule,
 * and a `split(' ').map(w => w[0])` is wrong for most of the world's names. The caller knows.
 *
 * **It is hidden unless labelled**, like `Badge`, for the same reason: an avatar is nearly always
 * next to the name it belongs to, and reading "MB, Mederick Bernier" is worse than reading the
 * name once.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(props, ref) {
  const { defaults, slots } = useComponentConfig('Avatar');
  const {
    src,
    alt = '',
    children,
    size = defaults?.size ?? 'md',
    shape = defaults?.shape ?? 'circle',
    color = defaults?.color ?? 'primary',
    className,
    classNames,
    style,
    'aria-label': ariaLabel,
  } = props;

  const [failed, setFailed] = useState(false);
  // A new URL deserves a new attempt; without this an avatar that once failed never recovers.
  useEffect(() => setFailed(false), [src]);

  const slot = (name: AvatarSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(
      hook,
      builtIn,
      ...(slots?.[name] ?? []),
      classNames?.[name],
      name === 'root' ? className : undefined,
    );

  const showImage = src != null && !failed;

  return (
    <span
      ref={ref}
      className={slot('root', 'grange-avatar', styles.avatar)}
      style={style}
      data-size={size}
      data-shape={shape}
      data-color={color}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {showImage ? (
        <img
          className={slot('image', 'grange-avatar-image', styles.image)}
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={slot('label', 'grange-avatar-label', styles.label)}>{children}</span>
      )}
    </span>
  );
});
