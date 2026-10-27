import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce, formatDate, getFaviconUrl, isValidUrl, truncate } from './index';

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('cuts long strings and appends an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });
});

describe('isValidUrl', () => {
  it('accepts absolute URLs', () => {
    expect(isValidUrl('https://github.com/org/repo')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  it('rejects relative paths and plain text', () => {
    expect(isValidUrl('/dashboard')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('getFaviconUrl', () => {
  it('builds a favicon URL from the hostname only', () => {
    expect(getFaviconUrl('https://app.linear.app/team/issue?x=1')).toBe(
      'https://www.google.com/s2/favicons?domain=app.linear.app&sz=32'
    );
  });

  it('returns an empty string for invalid URLs', () => {
    expect(getFaviconUrl('nope')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats as YYYY-MM-DD in UTC', () => {
    expect(formatDate(new Date('2026-03-09T23:30:00Z'))).toBe('2026-03-09');
  });
});

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('only calls the function once with the latest arguments', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    debounced('c');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });
});
