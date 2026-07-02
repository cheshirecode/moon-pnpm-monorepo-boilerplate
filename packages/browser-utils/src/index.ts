import stringify from 'fast-json-stable-stringify';

const toLowerCase = (value: string) => value.toLocaleLowerCase();

export function pascalToSeparatedWords(
  value: unknown = '',
  separator = '-',
  formatter = toLowerCase
): string {
  return String(value)
    .replace(' ', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((part) => formatter(part))
    .join(separator);
}

export function toCamel(value = ''): string {
  return value.replace(/[-_]([a-z])/g, (match) => match[1].toUpperCase());
}

export function toUnderscore(value = ''): string {
  return value.replace(/[- _]+/g, '_');
}

export function toHyphen(value = ''): string {
  return value.replace(/[- _]+/g, '-');
}

export function toSpaced(value = ''): string {
  return value.replace(/[- _]+/g, ' ');
}

export function splitAlphanumeric(value: unknown = ''): RegExpMatchArray | null {
  return String(value).match(/[^-_ \d]+|\d+/g);
}

export type FilterableValue =
  | number
  | string
  | FilterableValue[]
  | { [key: string]: FilterableValue };

export const SEARCH_KEYWORD_SEPARATORS = [',', ' '] as const;

export function deepFilter<T>(list: T[], search?: string): T[] {
  if (typeof search !== 'string' || search === '') {
    return list;
  }

  const regex = new RegExp(
    `[^${SEARCH_KEYWORD_SEPARATORS.join('')}[\\w\\-_\\d]]+|[\\w\\-_\\d]+`,
    'gi'
  );

  const included = (value: FilterableValue | null | undefined): boolean => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'number') {
      return included(String(value));
    }

    if (Array.isArray(value)) {
      return value.some((entry) => included(entry));
    }

    if (typeof value === 'object') {
      return included(stringify(value));
    }

    const parts = search.match(regex) ?? [];

    return parts.every((part) =>
      value.toLocaleLowerCase().includes(part.toLocaleLowerCase())
    );
  };

  return list.filter((entry) => included(entry as FilterableValue));
}

export function getRoundedToNearest(
  value: number,
  decimals: number = Number.MAX_SAFE_INTEGER,
  isRoundedUp = true
): number {
  if (!Number.isInteger(value)) {
    throw new TypeError('getRoundedToNearest - invalid value');
  }

  if (value === 0) {
    return 0;
  }

  const absValue = Math.abs(value);
  const maxDigits = String(Math.ceil(absValue)).length;
  const digitCount = Math.min(
    maxDigits,
    Number.isInteger(decimals) && decimals > 0
      ? decimals
      : Number.MAX_SAFE_INTEGER
  );
  const divisor = 10 ** (digitCount - 1);

  return (
    Math[isRoundedUp ? 'ceil' : 'floor'](absValue / divisor) *
    divisor *
    (value / absValue)
  );
}

export function getIntervals(
  values: number[],
  clamps: number[] | number = [1, 10],
  count = 3
): number[] {
  const [minSize, maxSize] = Array.isArray(clamps) ? clamps : [1, clamps];

  if (!Array.isArray(values) || !values.every(Number.isInteger)) {
    throw new TypeError('getIntervals - invalid values');
  }

  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError('getIntervals - invalid count');
  }

  if (!Number.isInteger(maxSize) || maxSize < 0) {
    throw new TypeError('getIntervals - invalid maxSize');
  }

  if (!Number.isInteger(minSize) || minSize > Number.MAX_SAFE_INTEGER) {
    throw new TypeError('getIntervals - invalid minSize');
  }

  if (count === 1) {
    return [maxSize];
  }

  if (maxSize === 0) {
    return [];
  }

  let result: number[];

  if (values.length > 0) {
    const sortedValues = [...new Set(values.concat(maxSize))].sort(
      (a, b) => a - b
    );
    const currentMaxIndex = sortedValues.indexOf(maxSize);
    const filteredValues = sortedValues.filter((entry, index) =>
      index <= currentMaxIndex - 1
        ? entry <= 0.9 * sortedValues[index + 1]
        : entry <= maxSize
    );
    const maxIndex = filteredValues.indexOf(maxSize);
    result = filteredValues.slice(
      Math.max(0, maxIndex + 1 - count),
      maxIndex + 1
    );
    result = result
      .concat(filteredValues.slice(maxIndex + 1, maxIndex + 1 + count - result.length))
      .slice(-1 * count);
  } else {
    const niceMaxSize = getRoundedToNearest(maxSize, 0, false);
    result = getIntervals(
      Array(count - 1)
        .fill(0)
        .map((_entry, index) =>
          Math.ceil(niceMaxSize / 2 ** (count - 1 - index))
        )
        .concat(maxSize),
      clamps,
      count
    );
  }

  return result.sort((a, b) => a - b).filter((entry) => entry >= minSize);
}

export function isEmptyObject(
  value: unknown,
  emptyValues: unknown[] = [undefined, null]
): boolean {
  return (
    value === Object(value) &&
    Object.keys(value as Record<string, unknown>).every((key) =>
      emptyValues.includes((value as Record<string, unknown>)[key])
    )
  );
}

export type ValidationError = string | undefined;
export type FieldValidator = (value: string) => ValidationError;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationError {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return undefined;
}

export function validatePhone(phone: string): ValidationError {
  if (!phone) {
    return 'Phone number is required';
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    return 'Phone number must be at least 10 digits';
  }

  if (digits.length > 11) {
    return 'Phone number is too long';
  }

  return undefined;
}

export function validateRequired(
  value: string,
  fieldName = 'This field'
): ValidationError {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }

  return undefined;
}

export function validateMinLength(
  value: string,
  minLength: number,
  fieldName = 'This field'
): ValidationError {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }

  return undefined;
}

export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName = 'This field'
): ValidationError {
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }

  return undefined;
}

export function validateName(
  name: string,
  fieldName = 'Name'
): ValidationError {
  if (!name) {
    return `${fieldName} is required`;
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/;

  if (!nameRegex.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  return undefined;
}

export function composeValidators(...validators: FieldValidator[]): FieldValidator {
  return (value: string) => {
    for (const validator of validators) {
      const error = validator(value);

      if (error) {
        return error;
      }
    }

    return undefined;
  };
}

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

export type QueryValue = boolean | number | string | null | undefined;
export type QueryInput = Record<string, QueryValue | QueryValue[]>;

export interface UpdateUrlOptions {
  history?: Pick<History, 'replaceState'>;
  href?: string;
  location?: Pick<Location, 'href'>;
}

const getDefaultHref = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost/';
  }

  return window.location.href;
};

const getDefaultHistory = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.history;
};

export function normalizeQueryValue(value: QueryValue): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return String(value);
}

export function createQuerySearchParams(input: QueryInput = {}): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(input)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const value of values) {
      const normalized = normalizeQueryValue(value);

      if (normalized !== undefined) {
        searchParams.append(key, normalized);
      }
    }
  }

  return searchParams;
}

export function getQueryParam(
  name: string,
  search: string | URLSearchParams
): string | undefined {
  const searchParams =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const value = searchParams.get(name);

  return value ?? undefined;
}

export function buildQueryUrl(
  href: string,
  updates: QueryInput | URLSearchParams,
  mode: 'append' | 'set' = 'set'
): string {
  const url = new URL(href);
  const entries =
    updates instanceof URLSearchParams
      ? Array.from(updates.entries())
      : Object.entries(updates);

  for (const [key, rawValue] of entries) {
    if (mode === 'set') {
      url.searchParams.delete(key);
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const value of values) {
      const normalized = normalizeQueryValue(value);

      if (normalized !== undefined) {
        url.searchParams.append(key, normalized);
      }
    }
  }

  return url.toString();
}

export function deleteQueryParams(href: string, names: string[]): string {
  const url = new URL(href);

  for (const name of names) {
    url.searchParams.delete(name);
  }

  return url.toString();
}

export function replaceQueryUrl(
  updates: QueryInput,
  options: UpdateUrlOptions = {}
): URL {
  const href = options.href ?? options.location?.href ?? getDefaultHref();
  const nextHref = buildQueryUrl(href, updates);
  const history = options.history ?? getDefaultHistory();

  history?.replaceState({}, '', nextHref);

  return new URL(nextHref);
}

export function clearQueryUrl(
  names: string[],
  options: UpdateUrlOptions = {}
): URL {
  const href = options.href ?? options.location?.href ?? getDefaultHref();
  const nextHref = deleteQueryParams(href, names);
  const history = options.history ?? getDefaultHistory();

  history?.replaceState({}, '', nextHref);

  return new URL(nextHref);
}
