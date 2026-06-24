// Minimal stub of `next/headers` so modules that import it can load under jsdom.
// Only the named exports referenced in app code are provided.
export const headers = async () => new Headers();
export const cookies = async () => ({
  get: () => undefined,
  getAll: () => [] as { name: string; value: string }[],
});
