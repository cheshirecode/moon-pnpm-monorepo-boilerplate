export interface ChainableUrlSearchParams extends URLSearchParams {
  setBulk(params: unknown, isAppend?: boolean): ChainableUrlSearchParams;
  deleteAll(): ChainableUrlSearchParams;
  appendStr(search: string): ChainableUrlSearchParams;
  entriesAsObj(): Record<string, string>;
  toUnderscoredKeys(): ChainableUrlSearchParams;
  toHyphenatedKeys(): ChainableUrlSearchParams;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toUnderscore = (value: string) => value.replace(/[- _]+/g, '_');
const toHyphen = (value: string) => value.replace(/[- _]+/g, '-');

function normalizeKeys(
  params: ChainableUrlSearchParams,
  normalize: (key: string) => string
): ChainableUrlSearchParams {
  const keysToDelete: string[] = [];
  const seenKeys: Record<string, number> = {};

  for (const key of Array.from(params.keys())) {
    const nextKey = normalize(key);

    if (key === nextKey) {
      continue;
    }

    const values = params.getAll(key);
    const valueIndex = Math.min(seenKeys[key] ?? 0, values.length - 1);
    seenKeys[key] = valueIndex + 1;
    params.append(nextKey, values[valueIndex]);
    keysToDelete.push(key);
  }

  for (const key of keysToDelete) {
    params.delete(key);
  }

  return params;
}

export function createUrlSearchParams(
  search: unknown = '',
  params: unknown = {}
): ChainableUrlSearchParams {
  const query = new URLSearchParams(String(search ?? '')) as ChainableUrlSearchParams;

  Object.assign(query, {
    setBulk(this: ChainableUrlSearchParams, nextParams: unknown, isAppend = false) {
      const paramsRecord = isRecord(nextParams) ? nextParams : {};

      for (const [key, value] of Object.entries(paramsRecord)) {
        this[isAppend ? 'append' : 'set'](key, String(value ?? ''));
      }

      return this;
    },
    deleteAll(this: ChainableUrlSearchParams) {
      for (const key of Array.from(this.keys())) {
        this.delete(key);
      }

      return this;
    },
    appendStr(this: ChainableUrlSearchParams, value: string) {
      return this.setBulk(Object.fromEntries(new URLSearchParams(value).entries()));
    },
    entriesAsObj(this: ChainableUrlSearchParams) {
      return Object.fromEntries(this.entries());
    },
    toUnderscoredKeys(this: ChainableUrlSearchParams) {
      return normalizeKeys(this, toUnderscore);
    },
    toHyphenatedKeys(this: ChainableUrlSearchParams) {
      return normalizeKeys(this, toHyphen);
    }
  });

  return query.setBulk(params);
}
