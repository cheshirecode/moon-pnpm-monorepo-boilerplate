import stringify from 'fast-json-stable-stringify';

const toLowerCase = (x: string) => x?.toLocaleLowerCase();
export const pascalToSeparatedWords = (str: unknown = '', sep = '-', formatter = toLowerCase) =>
  String(str)
    .replace(' ', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((x) => formatter(x))
    .join(sep);

export const toCamel = (str = '') => str.replace(/[-_]([a-z])/g, (x) => x[1].toUpperCase());
export const toUnderscore = (str = '') => str.replace(/[- _]+/g, '_');
export const toHyphen = (str = '') => str.replace(/[- _]+/g, '-');
export const toSpaced = (str = '') => str.replace(/[- _]+/g, ' ');

export const splitAlphanumeric = (str: unknown = '') => String(str).match(/[^-_ \d]+|\d+/g);

export type StringOrAny = (string | number) | (string | number)[] | { [key: string]: StringOrAny };

export const SEARCH_KEYWORD_SEPARATORS = [',', ' '];
/**
 * Deeply filter a recursive array of arrays or objects by given keywords and
 * return the result. refer to tests for examples
 *
 * @param list Array<T> to filter by keyword(s)
 * @param str string representing 1..n keyword(s) as comma- or space-separated list. abc | ab-c | ab_c are all treated of 1 keyword. 'abc,cd' > abc | cd. 'abc cd' > abc | cd
 * @returns filtered list
 */
export const deepFilter = <T>(list: T[], str?: string) => {
  if (
    typeof str !== 'string' ||
    [undefined, null].includes(str as unknown as undefined | null) ||
    str === ''
  ) {
    return list;
  }
  const regex = new RegExp(
    `[^${SEARCH_KEYWORD_SEPARATORS.join('')}[\\w\\-_\\d]]+|[\\w\\-_\\d]+`,
    'ig'
  );

  const included = (obj: StringOrAny, str1?: string): boolean => {
    if (
      typeof str1 !== 'string' ||
      [undefined, null].includes(obj as unknown as undefined | null)
    ) {
      return false;
    }
    if (str1 === '') {
      return true;
    }
    if (typeof obj === 'number') {
      return included(String(obj), str1);
    }
    if (Array.isArray(obj)) {
      return obj.some((x) => included(x, str1));
    }
    if (typeof obj === 'object') {
      return included(stringify(obj), str1);
    }
    if (typeof obj === 'string') {
      const splits = str1?.match(regex) ?? [];
      return splits?.every((x) => obj.toLocaleLowerCase().includes(x));
    }
    return false;
  };

  return list?.filter((d) => included(d as StringOrAny, str));
};
/**
 * getRoundedToNearest(12) > 20
 * getRoundedToNearest(105) > 200
 * getRoundedToNearest(105, 4, false) > 100
 * getRoundedToNearest(-12, 2, false) > -10
 *
 * @param n number to round
 * @param decimals how many digits (0 < d < digits of n excluding decimals)
 * @param isRoundedUp default to rounding up, false to round down
 * @returns rounded number
 */
export const getRoundedToNearest = (
  n: number,
  decimals: number = Number.MAX_SAFE_INTEGER,
  isRoundedUp = true
): number => {
  if (n !== ~~n) {
    // eslint-disable-next-line no-console
    console.error('getRoundedToNearest expect int for n. received', n);
    throw new TypeError('getRoundedToNearest - invalid n');
  }
  if (n === 0) {
    return 0;
  }
  const absN = Math.abs(n);
  const maxDigits = String(Math.ceil(absN)).length;
  const d = Math.min(
    maxDigits,
    decimals !== ~~decimals || decimals <= 0 ? Number.MAX_SAFE_INTEGER : decimals
  );
  const divisor = Math.pow(10, d - 1);
  return Math[isRoundedUp ? 'ceil' : 'floor'](absN / divisor) * divisor * (n / absN);
};

/**
 * clamped integer intervals between 0..n
 *
 * getIntervals([1, 10, 20, 50], 11) === [1, 11]
 * getIntervals([1, 10, 20, 50, 100, 250], 51) === [20, 51]
 * getIntervals([1, 10, 20, 50, 100, 250], 501) === [100, 250, 501]
 *
 * @param arr number[] - initial numbers. pass [] to seed automatically
 * @param clamps [number, number] - default - [0, 10]. min/max size
 * @param count number - default - 3. how many entries inc. maximum size
 *
 * @returns number[] - range of numbers up to n
 */
export const getIntervals = (
  arr: number[],
  clamps: number[] | number = [1, 10],
  count = 3
): number[] => {
  const [minSize, maxSize] = Array.isArray(clamps) ? clamps : [1, clamps];
  if (!Array.isArray(arr) || !arr.every(Number.isInteger)) {
    // eslint-disable-next-line no-console
    console.error('getIntervals - expect int[] for arr. received ', arr);
    throw new TypeError('getIntervals - invalid arr');
  }
  if (count < 0 || !Number.isInteger(count)) {
    // eslint-disable-next-line no-console
    console.error('getIntervals - expect int for count. received ', count);
    throw new TypeError('getIntervals - invalid n');
  }
  if (maxSize < 0 || !Number.isInteger(maxSize)) {
    // eslint-disable-next-line no-console
    console.error('getIntervals - expect int for maxSize. received ', maxSize);
    throw new TypeError('getIntervals - invalid maxSize');
  }
  if (minSize > Number.MAX_SAFE_INTEGER || !Number.isInteger(minSize)) {
    // eslint-disable-next-line no-console
    console.error('getIntervals - expect int for minSize. received ', maxSize);
    throw new TypeError('getIntervals - invalid minSize');
  }
  if (count === 1) {
    return [maxSize];
  }
  if (maxSize === 0) {
    return [];
  }
  let r;
  if (arr.length > 0) {
    const newArr = [...new Set(arr.concat(maxSize))];
    newArr.sort((a, b) => a - b);
    const currentMaxIndex = newArr.indexOf(maxSize);
    const filteredArr = newArr.filter((x, i) =>
      i <= currentMaxIndex - 1 ? x <= 0.9 * newArr[i + 1] : x <= maxSize
    );
    const maxIndex = filteredArr.indexOf(maxSize);
    r = filteredArr.slice(Math.max(0, maxIndex + 1 - count), maxIndex + 1);
    r = r
      .concat(filteredArr.slice(maxIndex + 1, maxIndex + 1 + count - r.length))
      .slice(-1 * count);
  } else {
    const niceMaxSize = getRoundedToNearest(maxSize, 0, false);
    r = getIntervals(
      Array(count - 1)
        .fill(0)
        .map((_x, i) => Math.ceil(niceMaxSize / Math.pow(2, count - 1 - i)))
        .concat(maxSize),
      clamps,
      count
    );
  }
  r.sort((a, b) => a - b);
  return r.filter((x) => x >= minSize);
};

export const isEmptyObject = (obj: unknown, emptyValues: unknown[] = [undefined, null]) =>
  obj === Object(obj) &&
  Object.keys(obj as Record<string, unknown>).every((x: string) =>
    emptyValues.includes((obj as Record<string, unknown>)[x] as typeof emptyValues[number])
  );

const noOp = () => undefined;

export async function timeout(ms = 1000, cb: () => void = noOp) {
  return await new Promise<ReturnType<typeof setTimeout>>((resolve, reject) => {
    const wait = setTimeout(() => {
      cb();
      clearTimeout(wait);
    }, ms);

    try {
      resolve(wait);
    } catch (e) {
      reject(e);
    }
  });
}
