import { useRef } from 'react';
import { useDateSegment } from 'react-aria';
import type { DateFieldState } from 'react-stately';

export type FieldSegment = DateFieldState['segments'][number];

export interface SegmentProps {
  segment: FieldSegment;
  state: DateFieldState;
  className?: string;
}

/**
 * One part of a date or a time: a day, a month, an hour, or the literal between two of them.
 *
 * Shared because the time field, the date field, the date picker and the date-time picker all
 * render the same thing with different geometry — the time picker's input mode draws 96 by 72
 * boxes from TimeInputTokens, while a date field is a line of segments inside an ordinary text
 * field. The behaviour is identical and belongs in one place; the size is not and does not.
 *
 * A literal is marked rather than skipped, because it has to be in the DOM for the field to read
 * correctly and must not be a tab stop.
 */
export function Segment({ segment, state, className }: SegmentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);

  return (
    <div
      {...segmentProps}
      ref={ref}
      className={className}
      data-literal={segment.type === 'literal' ? 'true' : undefined}
      data-placeholder={segment.isPlaceholder || undefined}
    >
      {segment.text}
    </div>
  );
}
