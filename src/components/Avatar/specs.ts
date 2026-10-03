/**
 * Avatar.
 *
 * Compose publishes no AvatarTokens — the file is a 404, as are SkeletonTokens and every other
 * name tried for this phase — but it does publish an avatar, inside ListTokens, as the leading
 * element of a list item. Those values are Google's and are used verbatim:
 *
 *   ItemLeadingAvatarSize       40dp
 *   ItemLeadingAvatarShape      CornerFull
 *   ItemLeadingAvatarColor      PrimaryContainer
 *   ItemLeadingAvatarLabelColor OnPrimaryContainer
 *   ItemLeadingAvatarLabelFont  TitleMedium
 *
 * The other two sizes are not invented either: 24 is ItemLeadingIconSize and 56 is
 * ItemLeadingImageWidth/Height, both from the same token file, so the three sizes are the three
 * things the spec already draws in that leading slot. Their label typescales are chosen, scaled
 * either side of the captured TitleMedium.
 */
export const avatar = {
  /** px. 40 is the token; 24 and 56 are the icon and image sizes from the same file. */
  sizes: { sm: 24, md: 40, lg: 56 },
  /** Per size, the typescale of the initials. Only the 40 one is a token. */
  labelFonts: { sm: 'label-medium', md: 'title-medium', lg: 'headline-small' },
  /** ItemLeadingAvatarShape: CornerFull. The other two shapes are chosen, from the corner scale. */
  corners: { circle: 9999, rounded: 'medium', square: 0 },
} as const;

export type AvatarSize = keyof typeof avatar.sizes;
export type AvatarShape = keyof typeof avatar.corners;
/** The container/on-container pairs an avatar can wear. PrimaryContainer is the token. */
export type AvatarColor = 'primary' | 'secondary' | 'tertiary' | 'surface';
