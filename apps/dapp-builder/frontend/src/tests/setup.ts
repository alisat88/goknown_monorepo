// Provide a fully-compliant in-memory localStorage mock.
// Required because jsdom's localStorage may be file-backed in this environment,
// which strips out the clear() method.

const makeLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string): void {
      store[key] = String(value);
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
  };
};

Object.defineProperty(globalThis, 'localStorage', {
  value: makeLocalStorageMock(),
  writable: true,
  configurable: true,
});
