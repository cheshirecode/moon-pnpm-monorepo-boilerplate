import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard, createCopyToClipboard } from './index';

const setNavigatorProperty = <T>(name: string, value: T) => {
  Object.defineProperty(navigator, name, {
    configurable: true,
    value
  });
};

const setDocumentMethod = <T extends (...args: never[]) => unknown>(
  name: string,
  fn: T
) => {
  Object.defineProperty(document, name, {
    configurable: true,
    value: fn
  });

  return fn;
};

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
  delete (navigator as Navigator & { permissions?: Permissions }).permissions;
});

describe('copyToClipboard', () => {
  it('writes with the Clipboard API when clipboard-write is granted', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const query = vi.fn().mockResolvedValue({ state: 'granted' });

    setNavigatorProperty('clipboard', { writeText });
    setNavigatorProperty('permissions', { query });

    await expect(copyToClipboard('copy me')).resolves.toBe(true);

    expect(query).toHaveBeenCalledWith({ name: 'clipboard-write' });
    expect(writeText).toHaveBeenCalledWith('copy me');
  });

  it('uses the Clipboard API when Permissions API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    setNavigatorProperty('clipboard', { writeText });

    await expect(copyToClipboard('copy me')).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith('copy me');
  });

  it('can prevent the source event default behavior', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const preventDefault = vi.fn();

    setNavigatorProperty('clipboard', { writeText });

    await expect(
      createCopyToClipboard('copy me', { preventDefault: true })({
        preventDefault
      })
    ).resolves.toBe(true);

    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('falls back to a temporary textarea and cleans it up', async () => {
    const queryCommandSupported = setDocumentMethod(
      'queryCommandSupported',
      vi.fn().mockReturnValue(true)
    );
    const execCommand = setDocumentMethod(
      'execCommand',
      vi.fn().mockReturnValue(true)
    );

    await expect(copyToClipboard('fallback copy')).resolves.toBe(true);

    expect(queryCommandSupported).toHaveBeenCalledWith('copy');
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('returns false when neither clipboard path is supported', async () => {
    setDocumentMethod('queryCommandSupported', vi.fn().mockReturnValue(false));

    await expect(copyToClipboard('copy me')).resolves.toBe(false);
  });

  it('returns false and cleans up when textarea copy fails', async () => {
    const logError = vi.fn();

    setDocumentMethod('queryCommandSupported', vi.fn().mockReturnValue(true));
    setDocumentMethod(
      'execCommand',
      vi.fn().mockImplementation(() => {
        throw new Error('blocked');
      })
    );

    await expect(copyToClipboard('copy me', { logError })).resolves.toBe(false);

    expect(logError).toHaveBeenCalledOnce();
    expect(document.querySelector('textarea')).toBeNull();
  });
});
