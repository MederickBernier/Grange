/** From Compose FloatingToolbarTokens and DockedToolbarTokens. */

export const floatingToolbar = {
  height: 64,
  /** Leading and trailing space inside the container, px. */
  padding: 8,
  /** Space between items, px. */
  gap: 4,
  /**
   * Space the spec leaves between a floating toolbar and the edge of the screen, px. Published as
   * a custom property rather than applied, because where the toolbar floats is the app's layout
   * decision, not the component's.
   */
  externalPadding: 16,
} as const;

export const dockedToolbar = {
  height: 64,
  /** Leading and trailing space inside the container, px. */
  padding: 16,
  /** Items spread out to fill the bar, but never closer than this or further than max, px. */
  minSpacing: 4,
  maxSpacing: 32,
} as const;
