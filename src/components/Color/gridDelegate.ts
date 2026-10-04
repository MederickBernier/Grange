import type { ListProps } from 'react-stately';

/* React Aria's key type, which unlike React 19's own does not include bigint. */
type Key = NonNullable<ListProps<unknown>['disabledKeys']> extends Iterable<infer K> ? K : never;

/**
 * Arrow keys across a grid of swatches.
 *
 * `useListBox` navigates a list, in one direction: its delegate's "left of" and "above" both
 * mean "the previous item". A palette is laid out in rows, so up and down have to move by a
 * whole row or the arrows do not match what is on screen — the oldest complaint about swatch
 * grids, and the reason this is written rather than left to the default.
 *
 * It is a plain class over an array of keys, so it can be tested as arithmetic; the only thing
 * it needs from the DOM is nothing at all.
 */
export class SwatchGridDelegate {
  private keys: Key[];
  private columns: number;
  private rtl: boolean;

  constructor(keys: Iterable<Key>, columns: number, direction: 'ltr' | 'rtl' = 'ltr') {
    this.keys = [...keys];
    this.columns = Math.max(1, columns);
    this.rtl = direction === 'rtl';
  }

  private at(index: number): Key | null {
    return index >= 0 && index < this.keys.length ? this.keys[index]! : null;
  }

  private indexOf(key: Key): number {
    return this.keys.indexOf(key);
  }

  /** One step along the row, stopping at its ends rather than wrapping onto the next. */
  private step(key: Key, by: number): Key | null {
    const index = this.indexOf(key);
    if (index === -1) return null;
    const next = index + by;
    // Wrapping across a row edge looks like a jump to the far side of the palette, which is
    // not what pressing right at the end of a row means.
    if (Math.floor(index / this.columns) !== Math.floor(next / this.columns)) return null;
    return this.at(next);
  }

  getKeyRightOf(key: Key): Key | null {
    return this.step(key, this.rtl ? -1 : 1);
  }

  getKeyLeftOf(key: Key): Key | null {
    return this.step(key, this.rtl ? 1 : -1);
  }

  getKeyBelow(key: Key): Key | null {
    const index = this.indexOf(key);
    return index === -1 ? null : this.at(index + this.columns);
  }

  getKeyAbove(key: Key): Key | null {
    const index = this.indexOf(key);
    return index === -1 ? null : this.at(index - this.columns);
  }

  getFirstKey(): Key | null {
    return this.at(0);
  }

  getLastKey(): Key | null {
    return this.at(this.keys.length - 1);
  }
}
