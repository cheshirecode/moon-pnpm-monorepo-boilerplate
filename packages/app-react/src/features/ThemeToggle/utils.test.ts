import { beforeEach, describe, expect, it } from 'vitest';

import { addTheme, removeTheme } from './utils';

const cachedClassList = document?.documentElement?.classList;
beforeEach(() => {
  if (document?.documentElement instanceof HTMLElement) {
    document.documentElement.setAttribute('class', '');
    document.documentElement.classList.add(...cachedClassList);
  }
});

describe('@/utils', () => {
  it('addTheme', () => {
    if (document?.documentElement instanceof HTMLElement) {
      const d = document.documentElement;
      const getL = () => [...d.classList.entries()].length;
      const n = getL();
      addTheme('light');
      expect(d.classList.contains('light')).toBeTruthy();
      // expect(d.dataset.theme).toBe('light');
      expect(getL()).toBe(n + 1);
      addTheme('light');
      expect(getL()).toBe(n + 1);
      addTheme('another-theme');
      expect(d.classList.contains('another-theme')).toBeTruthy();
      expect(getL()).toBe(n + 2);
      removeTheme('another-theme');
      expect(getL()).toBe(n + 1);
    }
  });
});
