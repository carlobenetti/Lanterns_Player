import * as tauriLog from '@tauri-apps/plugin-log';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatLogValue, Logger } from './logger';

vi.mock('@tauri-apps/plugin-log');

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefixes messages with scope and calls correct Tauri log function', async () => {
    await Logger.playback.info('Track started');
    await Logger.streaming.trace('Timing');
    await Logger.history.debug('Request');
    await Logger.fs.warn('Retry');
    await Logger.queue.error('Crashed');

    expect(tauriLog.info).toHaveBeenCalledWith('[playback] Track started');
    expect(tauriLog.trace).toHaveBeenCalledWith('[streaming] Timing');
    expect(tauriLog.debug).toHaveBeenCalledWith('[history] Request');
    expect(tauriLog.warn).toHaveBeenCalledWith('[fs] Retry');
    expect(tauriLog.error).toHaveBeenCalledWith('[queue] Crashed');
  });
});

describe('formatLogValue', () => {
  it('handles all sorts of values', () => {
    expect(formatLogValue('hello')).toBe('hello');
    expect(formatLogValue(42)).toBe('42');
    expect(formatLogValue(true)).toBe('true');
    expect(formatLogValue(null)).toBe('null');
    expect(formatLogValue(undefined)).toBe('undefined');
    expect(formatLogValue({ name: 'test', count: 5 })).toBe(
      '{"name":"test","count":5}',
    );
    expect(formatLogValue([1, 2, 3])).toBe('[1,2,3]');
    expect(formatLogValue({ a: { b: 1 } })).toBe('{"a":{"b":1}}');
    expect(formatLogValue({})).toBe('{}');
    expect(formatLogValue([])).toBe('[]');
  });

  it('formats Errors with name, message and stack', () => {
    const error = new Error('Failed');
    error.stack = 'Error: Failed\n    at test.js:1:1';

    const result = formatLogValue(error);

    expect(result).toContain('Error: Failed');
    expect(result).toContain('at test.js:1:1');

    const typeError = new TypeError('Invalid');
    expect(formatLogValue(typeError)).toContain('TypeError: Invalid');

    const noStack = new Error('No stack');
    noStack.stack = undefined;
    expect(formatLogValue(noStack)).toBe('Error: No stack');
  });

  it('handles unserializable values gracefully', () => {
    const circular: Record<string, unknown> = { name: 'test' };
    circular.self = circular;
    expect(formatLogValue(circular)).toContain('[Unserializable object:');

    const withBigInt = { big: BigInt(123) };
    expect(formatLogValue(withBigInt)).toContain('[Unserializable object:');

    const fn = function myFunc() {};
    expect(formatLogValue(fn)).toBe('[Function: myFunc]');
    expect(formatLogValue(() => {})).toBe('[Function: anonymous]');
  });

  it('truncates long values at 4000 chars', () => {
    const longString = 'x'.repeat(5000);
    expect(formatLogValue(longString)).toBe(
      'x'.repeat(4000) + '... [truncated]',
    );

    const longArray = Array(1000).fill('test');
    const result = formatLogValue(longArray);
    expect(result).toContain('... [truncated]');
    expect(result.length).toBeLessThanOrEqual(4015);

    const longStack = new Error('Test');
    longStack.stack = 'Error: Test\n' + '    at x.js:1\n'.repeat(500);
    expect(formatLogValue(longStack)).toContain('... [truncated]');
  });
});
