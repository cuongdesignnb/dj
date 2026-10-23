import { describe, expect, it } from 'vitest';
import { parseByteRange } from '@/server/media/storage';

describe('parseByteRange', () => {
  it('reads the ranges video players send', () => {
    expect(parseByteRange('bytes=0-1', 1000)).toEqual({ start: 0, end: 1 });
    expect(parseByteRange('bytes=0-', 1000)).toEqual({ start: 0, end: 999 });
    expect(parseByteRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
    expect(parseByteRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(parseByteRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });

  it('returns null without a header and invalid for unsatisfiable or multi ranges', () => {
    expect(parseByteRange(null, 1000)).toBeNull();
    for (const header of ['bytes=1000-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,5-6', 'items=0-1']) {
      expect(parseByteRange(header, 1000), header).toBe('invalid');
    }
  });
});
