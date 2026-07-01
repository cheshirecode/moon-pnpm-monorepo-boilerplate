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
