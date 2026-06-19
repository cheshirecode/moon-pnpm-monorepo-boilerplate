import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length() {
    return this.#store.size;
  }

  clear() {
    this.#store.clear();
  }

  getItem(key: string) {
    return this.#store.get(key) ?? null;
  }

  key(index: number) {
    return [...this.#store.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.#store.delete(key);
  }

  setItem(key: string, value: string) {
    this.#store.set(key, String(value));
  }
}

const ensureStorage = (name: "localStorage" | "sessionStorage") => {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: new MemoryStorage(),
  });
};

ensureStorage("localStorage");
ensureStorage("sessionStorage");

expect.extend(matchers);
beforeEach(() => {
  vi.restoreAllMocks();
  if (typeof window !== "undefined") {
    (window as Window & { happyDOM?: { setURL(url: string): void } }).happyDOM?.setURL(
      "https://localhost/",
    );
  }
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
});
// Test DOM environments do not consistently provide this browser API.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
