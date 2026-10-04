import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { IconButton } from '../Button/Button';
import { SelectableList, SelectableListItem } from '../List/SelectableList';
import { useControlledState } from '../../utils';
import {
  resolveSlotClass,
  useComponentConfig,
  type SlotOverrides,
  type TransferListSlot,
} from '../../config/config';
import { keepSelected, movable, transfer, type TransferItem } from './transfer';
import styles from './TransferList.module.scss';

export interface TransferListProps {
  /** Every item, in the order both sides should show them in. */
  items: readonly TransferItem[];
  /** The ids on the right-hand side. Everything else is on the left. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: string[]) => void;
  /** What each side is called. Both are read out, so they should say what the sides mean. */
  sourceLabel?: ReactNode;
  targetLabel?: ReactNode;
  /** Hides the "move everything" buttons, for a list where that would be a mistake. */
  allowMoveAll?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotOverrides<TransferListSlot>;
}

/**
 * Two lists and the buttons that move items between them — Kendo's ListBox.
 *
 * `SelectableList` already covers one list, so this is only the transfer part: the second list,
 * the four buttons, and the bookkeeping that makes a move not lose anything.
 *
 * **The announcement is the part that is usually missing.** Pressing "move right" changes two
 * lists at once and moves focus nowhere; without a live region a screen reader user presses a
 * button and hears nothing at all. Here each move says what moved and where it went.
 *
 * Both sides keep the order of `items` rather than appending, because a transfer list is
 * usually a set of options in a meaningful order — days, sizes, priorities — and moving one
 * back should return it to its place rather than to the end.
 *
 * Order within the target is therefore **not** reorderable here. A list whose order is the
 * user's to choose is a different component: `Sortable`.
 */
export function TransferList(props: TransferListProps) {
  const { defaults, slots } = useComponentConfig('TransferList');
  const {
    items,
    value,
    defaultValue = [],
    onChange,
    sourceLabel = 'Available',
    targetLabel = 'Chosen',
    allowMoveAll = defaults?.allowMoveAll ?? true,
    disabled,
    className,
    classNames,
    style,
  } = props;

  const [chosen, setChosen] = useControlledState<readonly string[]>(value, defaultValue, (next) =>
    onChange?.([...next]),
  );

  const target = useMemo(
    () => items.filter((item) => chosen.includes(item.id)),
    [items, chosen],
  );
  const source = useMemo(
    () => items.filter((item) => !chosen.includes(item.id)),
    [items, chosen],
  );

  const [sourceSelected, setSourceSelected] = useState<Set<string>>(new Set());
  const [targetSelected, setTargetSelected] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState('');

  const move = (ids: Iterable<string>, toTarget: boolean) => {
    const from = toTarget ? source : target;
    const to = toTarget ? target : source;
    const moved = transfer(from, to, ids, items);
    const count = from.length - moved.from.length;
    if (count === 0) return;

    setChosen(toTarget ? moved.to.map((i) => i.id) : moved.from.map((i) => i.id));
    // Said, not only drawn: the press changes two lists and moves focus nowhere.
    setAnnouncement(`${count} ${count === 1 ? 'item' : 'items'} moved to ${toTarget ? 'chosen' : 'available'}`);
    // The keys that moved are no longer on this side, so a listbox would be holding keys it
    // does not have.
    setSourceSelected((keys) => keepSelected(keys, toTarget ? moved.from : moved.to));
    setTargetSelected((keys) => keepSelected(keys, toTarget ? moved.to : moved.from));
  };

  const slot = (name: TransferListSlot, hook: string, builtIn?: string) =>
    resolveSlotClass(hook, builtIn, ...(slots?.[name] ?? []), classNames?.[name], name === 'root' ? className : undefined);

  const side = (
    which: 'source' | 'target',
    label: ReactNode,
    list: readonly TransferItem[],
    selected: Set<string>,
    setSelected: (keys: Set<string>) => void,
  ) => (
    <div className={styles.side}>
      <span className={styles.heading} id={`${which}-heading`}>
        {label}
      </span>
      <SelectableList
        aria-labelledby={`${which}-heading`}
        className={slot('list', `grange-transfer-${which}`, styles.list)}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(keys === 'all' ? new Set(movable(list)) : new Set([...keys].map(String)))
        }
        disabledKeys={list.filter((item) => item.disabled).map((item) => item.id)}
      >
        {list.map((item) => (
          <SelectableListItem key={item.id}>{item.label}</SelectableListItem>
        ))}
      </SelectableList>
    </div>
  );

  return (
    <div className={slot('root', 'grange-transfer-list', styles.transfer)} style={style}>
      {side('source', sourceLabel, source, sourceSelected, setSourceSelected)}

      <div className={styles.controls}>
        <IconButton
          variant="outlined"
          size="xs"
          aria-label="Move selected to chosen"
          disabled={disabled || sourceSelected.size === 0}
          onClick={() => move(sourceSelected, true)}
        >
          <Glyph path="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
        </IconButton>
        {allowMoveAll && (
          <IconButton
            variant="outlined"
            size="xs"
            aria-label="Move all to chosen"
            disabled={disabled || movable(source).length === 0}
            onClick={() => move(movable(source), true)}
          >
            <Glyph path="M383-480 200-664l56-57 240 241-240 240-56-57 183-183Zm264 0L464-664l56-57 240 241-240 240-56-57 183-183Z" />
          </IconButton>
        )}
        <IconButton
          variant="outlined"
          size="xs"
          aria-label="Move selected to available"
          disabled={disabled || targetSelected.size === 0}
          onClick={() => move(targetSelected, false)}
        >
          <Glyph path="M313-440l224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
        </IconButton>
        {allowMoveAll && (
          <IconButton
            variant="outlined"
            size="xs"
            aria-label="Move all to available"
            disabled={disabled || movable(target).length === 0}
            onClick={() => move(movable(target), false)}
          >
            <Glyph path="M577-480l183 184-56 57-240-241 240-240 56 57-183 183Zm-264 0l183 184-56 57-240-241 240-240 56 57-183 183Z" />
          </IconButton>
        )}
      </div>

      {side('target', targetLabel, target, targetSelected, setTargetSelected)}

      {/*
        The whole point of the component for a screen reader: a press changes two lists at once
        and leaves focus where it was, so without this nothing says it happened.
      */}
      <span className={styles.announcement} role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

const Glyph = ({ path }: { path: string }) => (
  <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
    <path d={path} />
  </svg>
);
