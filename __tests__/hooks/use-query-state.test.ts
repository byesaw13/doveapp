import {
  parseArrayParam,
  serializeArrayParam,
  parseDateParam,
  serializeDateParam,
} from '@/lib/hooks/use-query-state';

describe('use-query-state utilities', () => {
  describe('parseArrayParam', () => {
    it('should return empty array for null value', () => {
      expect(parseArrayParam(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseArrayParam('')).toEqual([]);
    });

    it('should split comma-separated values', () => {
      expect(parseArrayParam('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should filter empty values', () => {
      expect(parseArrayParam('a,,b,')).toEqual(['a', 'b']);
    });

    it('should use custom separator', () => {
      expect(parseArrayParam('a|b|c', '|')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('serializeArrayParam', () => {
    it('should return null for empty array', () => {
      expect(serializeArrayParam([])).toBeNull();
    });

    it('should join values with comma', () => {
      expect(serializeArrayParam(['a', 'b', 'c'])).toBe('a,b,c');
    });

    it('should use custom separator', () => {
      expect(serializeArrayParam(['a', 'b'], '|')).toBe('a|b');
    });
  });

  describe('parseDateParam', () => {
    it('should return undefined for null value', () => {
      expect(parseDateParam(null)).toBeUndefined();
    });

    it('should return undefined for invalid date', () => {
      expect(parseDateParam('invalid')).toBeUndefined();
    });

    it('should parse valid ISO date string', () => {
      const result = parseDateParam('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
    });
  });

  describe('serializeDateParam', () => {
    it('should return null for undefined', () => {
      expect(serializeDateParam(undefined)).toBeNull();
    });

    it('should format date as ISO date string', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(serializeDateParam(date)).toBe('2024-01-15');
    });
  });
});
