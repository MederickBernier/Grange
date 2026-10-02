/**
 * From Compose AppBarTokens for what every bar shares, and the per-size token objects for the
 * heights and the title typescale.
 *
 * The flexible sizes are M3 Expressive's, and each publishes two heights: the shorter one for a
 * title on its own and the taller for a title with a subtitle.
 */
export type AppBarSize = 'small' | 'medium' | 'large' | 'mediumFlexible' | 'largeFlexible';

export interface AppBarSizeSpec {
  height: number;
  /** Height when a subtitle is present. The same as `height` where no second one is published. */
  heightWithSubtitle: number;
  titleTypescale: string;
  subtitleTypescale: string;
  /** Small bars keep the title inline with the icons; the taller sizes drop it to its own line. */
  stacked: boolean;
}

export const appBarSizes: Record<AppBarSize, AppBarSizeSpec> = {
  small: {
    height: 64,
    heightWithSubtitle: 64,
    titleTypescale: 'title-large',
    subtitleTypescale: 'label-medium',
    stacked: false,
  },
  medium: {
    height: 112,
    heightWithSubtitle: 112,
    titleTypescale: 'headline-small',
    // AppBarMedium publishes no subtitle font; the small bar's is used.
    subtitleTypescale: 'label-medium',
    stacked: true,
  },
  large: {
    height: 152,
    heightWithSubtitle: 152,
    titleTypescale: 'headline-medium',
    subtitleTypescale: 'label-medium',
    stacked: true,
  },
  mediumFlexible: {
    height: 112,
    heightWithSubtitle: 136,
    titleTypescale: 'headline-medium',
    subtitleTypescale: 'label-large',
    stacked: true,
  },
  largeFlexible: {
    height: 120,
    heightWithSubtitle: 152,
    titleTypescale: 'display-small',
    subtitleTypescale: 'title-medium',
    stacked: true,
  },
};

export const appBar = {
  /** Leading and trailing space, px. */
  leadingSpace: 4,
  trailingSpace: 4,
  icon: 24,
  avatar: 32,
  /** Not tokenised: the space the title keeps from the edge once it is on its own line. */
  titleInline: 16,
} as const;
