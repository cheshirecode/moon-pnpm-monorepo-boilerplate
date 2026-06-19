// @ts-nocheck
import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

class MemoryStorage {
  #store = new Map();

  get length() {
    return this.#store.size;
  }

  clear() {
    this.#store.clear();
  }

  getItem(key) {
    return this.#store.get(key) ?? null;
  }

  key(index) {
    return [...this.#store.keys()][index] ?? null;
  }

  removeItem(key) {
    this.#store.delete(key);
  }

  setItem(key, value) {
    this.#store.set(key, String(value));
  }
}

const ensureStorage = (target, name) => {
  Object.defineProperty(target, name, {
    configurable: true,
    value: new MemoryStorage()
  });
};

// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
if (typeof window !== 'undefined') {
  ensureStorage(globalThis, 'localStorage');
  ensureStorage(globalThis, 'sessionStorage');
  ensureStorage(window, 'localStorage');
  ensureStorage(window, 'sessionStorage');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

global.FormData = function () {
  this.append = function () {};
};
