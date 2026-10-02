import { describe, expect, it } from 'vitest';
import { MASK_RULES, applyMask, maskCapacity, unmask } from './mask';

const PHONE = '(000) 000-0000';

describe('mask rules', () => {
  it('takes digits, letters, either, or anything', () => {
    expect(MASK_RULES['0']!('7')).toBe(true);
    expect(MASK_RULES['0']!('a')).toBe(false);
    expect(MASK_RULES.L!('a')).toBe(true);
    expect(MASK_RULES.L!('7')).toBe(false);
    // Any alphabet, not just the latin one.
    expect(MASK_RULES.L!('é')).toBe(true);
    expect(MASK_RULES.L!('д')).toBe(true);
    expect(MASK_RULES.A!('7')).toBe(true);
    expect(MASK_RULES.A!('a')).toBe(true);
    expect(MASK_RULES.A!('-')).toBe(false);
    expect(MASK_RULES['*']!('-')).toBe(true);
  });

  it('counts only the positions that take input', () => {
    expect(maskCapacity(PHONE)).toBe(10);
    expect(maskCapacity('0000-0000')).toBe(8);
    expect(maskCapacity('literal')).toBe(0);
  });
});

describe('applying a mask', () => {
  it('shows the literals and prompts the rest before anything is typed', () => {
    expect(applyMask('', PHONE)).toMatchObject({
      display: '(___) ___-____',
      raw: '',
      caret: 0,
      complete: false,
    });
  });

  it('fills left to right, writing the literals as it goes', () => {
    expect(applyMask('5', PHONE).display).toBe('(5__) ___-____');
    expect(applyMask('555', PHONE).display).toBe('(555) ___-____');
    expect(applyMask('5551', PHONE).display).toBe('(555) 1__-____');
  });

  it('is complete only when every position is filled', () => {
    expect(applyMask('555123456', PHONE).complete).toBe(false);
    const full = applyMask('5551234567', PHONE);
    expect(full.display).toBe('(555) 123-4567');
    expect(full.complete).toBe(true);
    // Nothing beyond the pattern's capacity gets in.
    expect(applyMask('55512345678999', PHONE).display).toBe('(555) 123-4567');
  });

  it('drops a character that does not fit rather than shifting the rest', () => {
    // The letters cannot go in a digit position, so they are skipped and the digits keep their
    // places — which is what makes pasting a formatted value work.
    expect(applyMask('555-123-4567', PHONE).display).toBe('(555) 123-4567');
    expect(applyMask('(555) 123-4567', PHONE).display).toBe('(555) 123-4567');
    expect(applyMask('5a5b5c', PHONE).display).toBe('(555) ___-____');
  });

  it('puts the caret after the last filled position, not at the end', () => {
    expect(applyMask('', PHONE).caret).toBe(0);
    // "(5" — the caret sits after the digit, inside the brackets.
    expect(applyMask('5', PHONE).caret).toBe(2);
    expect(applyMask('555', PHONE).caret).toBe(4);
    // Past the ") " literal and onto the next digit.
    expect(applyMask('5551', PHONE).caret).toBe(7);
    expect(applyMask('5551234567', PHONE).caret).toBe(14);
  });

  it('reports the typed characters separately from what is shown', () => {
    const applied = applyMask('5551234567', PHONE);
    expect(applied.raw).toBe('5551234567');
    expect(applied.display).toBe('(555) 123-4567');
  });

  it('handles a mask of mixed rules', () => {
    const key = 'AAAA-AAAA';
    expect(applyMask('ab12cd34', key).display).toBe('ab12-cd34');
    expect(applyMask('ab12cd34', key).complete).toBe(true);
    expect(applyMask('a', 'L0L 0L0').display).toBe('a__ ___');
  });

  it('swallows a typed copy of the next literal instead of writing it twice', () => {
    // Typing the dash in a date rather than letting the mask supply it.
    expect(applyMask('2026-10', '0000-00').display).toBe('2026-10');
  });

  it('takes a different prompt character', () => {
    expect(applyMask('', '000', '#').display).toBe('###');
    expect(applyMask('1', '000', '·').display).toBe('1··');
  });

  it('has nothing to do with a mask that is all literals', () => {
    expect(applyMask('anything', 'abc')).toMatchObject({ display: 'abc', raw: '', complete: true });
  });
});

describe('reading a value back out', () => {
  it('strips the literals and the prompts', () => {
    expect(unmask('(555) 123-4567', PHONE)).toBe('5551234567');
    expect(unmask('(555) ___-____', PHONE)).toBe('555');
    expect(unmask('(___) ___-____', PHONE)).toBe('');
  });

  it('round trips with applyMask, which is what every edit does', () => {
    for (const typed of ['', '5', '555', '5551234', '5551234567']) {
      const shown = applyMask(typed, PHONE).display;
      expect(unmask(shown, PHONE)).toBe(typed);
    }
  });

  it('keeps a character the browser has shifted onto a literal position', () => {
    // After deleting a digit the browser leaves "(55) 123-4567": position 3 is a literal in the
    // mask but holds a digit here, and that digit is still part of the value.
    expect(unmask('(55) 123-4567', PHONE)).toBe('551234567');
  });

  it('drops a character that could never have been typed there', () => {
    expect(unmask('(5a5) ___-____', PHONE)).toBe('55');
  });
});
