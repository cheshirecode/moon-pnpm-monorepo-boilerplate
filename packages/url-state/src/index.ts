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

export function createUrlSearchParams(input: QueryInput = {}): URLSearchParams {
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
  updates: QueryInput,
  mode: 'append' | 'set' = 'set'
): string {
  const url = new URL(href);

  for (const [key, rawValue] of Object.entries(updates)) {
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
