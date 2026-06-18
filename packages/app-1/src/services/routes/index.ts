import { parse as parsePattern } from 'regexparam';
import { matchRoute, useLocation } from 'wouter';
import type { LocationHook } from 'wouter';

import createUrlSearchParams from './createUrlSearchParams';

// fn just in case of later dynamism
export const getBaseUrl = (endpoint = '') =>
  `${import.meta.env.VITE_BASE_URL}/${endpoint}`.replace(/(\/{2,})/g, '/');

/**
 * Wouter custom hook - return query string as well
 *
 * @param options base wouter options for routing
 * @returns
 */
export const useQueryString = (
  options: Parameters<LocationHook>[0],
  locationHref = location.href
) => {
  const { pathname, search } = new URL(locationHref);
  const [_location, setLocation] = useLocation(options);
  return [pathname + search, setLocation];
};

/**
 * Wouter custom hook - return query string as well and update document.title based on route name
 *
 * @param options base wouter options for routing
 * @returns
 */
export const useTitleUpdate = (
  options: Parameters<LocationHook>[0],
  locationHref = location.href
) => {
  const { pathname } = new URL(locationHref);
  if (document) {
    document.title = pathname
      .slice(1)
      .split('-')
      .map((x) => x.slice(0, 1).toLocaleUpperCase() + x.slice(1))
      .join(' ');
  }
  return useQueryString(options);
};

export const multipathMatcher = (patterns: string | string[], path: string) => {
  const flattedPatterns = [patterns].flat();
  for (const p of flattedPatterns) {
    const [match, params] = matchRoute(parsePattern, p, path);
    if (match) return [match, normalizeRouteParams(params)];

    const legacyMatch = matchLegacyWildcardRoute(p, path);
    if (legacyMatch) return legacyMatch;
  }

  return [false, null];
};

const normalizeRouteParams = (params: Record<string, string | undefined>) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => !/^\d+$/.test(key))
      .map(([key, value]) => [key.replace(/\*$/, ''), value])
  );

const matchLegacyWildcardRoute = (pattern: string, path: string) => {
  const names: string[] = [];
  const source = pattern
    .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
    .replace(/(.?):([A-Za-z0-9_]+)\*/g, (_match, prefix: string, name: string) => {
      names.push(name);
      return `${prefix}${prefix && prefix !== '/' && prefix !== '?' ? '([^/?#]*)' : '(.+)'}`;
    });
  if (names.length === 0) {
    return null;
  }

  const match = new RegExp(`^${source}/?$`, 'i').exec(path);
  if (!match) {
    return null;
  }

  return [true, Object.fromEntries(names.map((name, i) => [name, match[i + 1]]))] as const;
};

const useLocationSetter = (locationHref: string, setter?: ReturnType<LocationHook>[1]) => {
  // stuck with 2.9.0 until https://github.com/molefrog/wouter/issues/286 is resolved
  const [location, setLocation] = useLocation();
  const finalLocationHref = locationHref ?? location;
  setter = setter ?? setLocation;
  const url = new URL(finalLocationHref);
  return { setter, url } as const;
};

export const queryString = {
  get(x: string, locationHref = location.href) {
    const { search } = new URL(locationHref);
    const q = new URLSearchParams(search);
    return q.get(x);
  },

  createAppendedUrl(str: string, locationHref = location.href) {
    const url = new URL(locationHref);
    const q = createUrlSearchParams(url.search);
    q.appendStr(str);
    url.search = q.toString();
    return url;
  },

  useSetQsParam(locationHref = location.href, setter: ReturnType<LocationHook>[1]) {
    const { setter: finalSetter, url } = useLocationSetter(locationHref, setter);
    const { search } = url;
    return (k: string, v: string | number) => {
      const q = createUrlSearchParams(search, { [k]: v });
      url.search = q.toString();
      finalSetter(url.toString());
    };
  },

  useSetQsParams(locationHref = location.href, setter: ReturnType<LocationHook>[1]) {
    const { setter: finalSetter, url } = useLocationSetter(locationHref, setter);
    const { search } = url;
    return (params: Record<string, string | number>) => {
      const q = createUrlSearchParams(search, params);
      url.search = q.toString();
      finalSetter(url.toString());
    };
  },

  useSetQs(locationHref = location.href, setter?: ReturnType<LocationHook>[1]) {
    const { setter: finalSetter, url } = useLocationSetter(locationHref, setter);
    const { search } = url;

    return (str: string) => {
      const q = createUrlSearchParams(search).appendStr(str);
      url.search = q.toString();
      finalSetter(url.toString(), {
        replace: false
      });
    };
  }
};
