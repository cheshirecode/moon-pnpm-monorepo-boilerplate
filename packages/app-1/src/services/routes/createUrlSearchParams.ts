import { isPlainObject, isUndefined } from 'lodash-es';

import { toHyphen, toUnderscore } from '@/utils';

export interface CURLSearchParams extends URLSearchParams {
  setBulk: (params: unknown, isAppend?: boolean) => CURLSearchParams;
  deleteAll: () => CURLSearchParams;
  appendStr: (str: string) => CURLSearchParams;
  entriesAsObj: () => Record<string, string>;
  // convert all keys' separators to underscore: foo-bar 2 > foo_bar_2
  toUnderscoredKeys: () => CURLSearchParams;
  // convert all keys' separators to hyphens: foo_bar 2 > foo-bar-2
  toHyphenatedKeys: () => CURLSearchParams;
}
export default function createUrlSearchParams(
  search = '',
  params: Record<string, string | number> = {}
) {
  // coerce search to string or fall back to ''
  // @ts-ignore
  const q: CURLSearchParams = new URLSearchParams(search?.toString() ?? (search || ''));

  Object.assign(q, {
    setBulk: function (params: Record<string, string>, isAppend = false) {
      const t = this as CURLSearchParams;
      Object.keys(isPlainObject(params) ? params : {}).forEach((k) =>
        t[isAppend ? 'append' : 'set'](k, params[k])
      );
      return t;
    },
    deleteAll: function () {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const t: CURLSearchParams = this;
      [...t.keys()].forEach((k) => {
        t.delete(k);
      });
      return this;
    },
    entriesAsObj: function () {
      return Object.fromEntries([...(this as CURLSearchParams).entries()]);
    },
    toUnderscoredKeys: function () {
      const t = this as CURLSearchParams;
      const keysToDelete: string[] = [];
      const keys: Record<string, number> = {};
      [...t.keys()].forEach((k) => {
        if (k !== toUnderscore(k)) {
          let i = (keys[k] ?? 0) + 1;
          const values = t.getAll(k);
          // if there are more keys to convert, take the last one
          i = i > values.length - 1 ? values.length - 1 : i;
          keys[k] = i + 1;
          t.append(toUnderscore(k), values[i]);
          keysToDelete.push(k);
        }
      });
      keysToDelete.forEach((k) => t.delete(k));
      return this;
    },
    toHyphenatedKeys: function () {
      const t = this as CURLSearchParams;
      const keysToDelete: string[] = [];
      const keys: Record<string, number> = {};
      [...t.keys()].forEach((k) => {
        if (k !== toHyphen(k)) {
          let i = keys[k] ?? 0;
          const values = t.getAll(k);
          // if there are more keys to convert, take the last one
          i = i > values.length - 1 ? values.length - 1 : i;
          keys[k] = i + 1;
          t.append(toHyphen(k), values[i]);
          keysToDelete.push(k);
        }
      });
      keysToDelete.forEach((k) => t.delete(k));
      return this;
    }
  });
  q.appendStr = function (str: string) {
    const params = Object.fromEntries(
      [...new URLSearchParams(str).entries()].filter((x) => !isUndefined(x[1]))
    );
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const t: CURLSearchParams = this;
    return t.setBulk(params);
  };
  q.setBulk.bind(q);
  q.deleteAll.bind(q);
  q.appendStr.bind(q);
  // keep setBulk on each instance to reuse
  q.setBulk(params);
  return q;
}
