import stringify from 'fast-json-stable-stringify';
import { isPlainObject, merge } from 'lodash-es';
import type { BareFetcher, Key, Middleware, SWRConfiguration, SWRHook, SWRResponse } from 'swr';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import type { SWRMutationConfiguration } from 'swr/mutation';

type RequestOptions = RequestInit & {
  debug?: boolean;
};

export type Fetcher = <T>(url: string, options?: RequestOptions) => Promise<T>;
export type ErrorMessage = {
  title: string;
  status: number | string;
  message?: unknown;
  objects?: unknown[];
};
export type SWRResponseWithErrors<T> = SWRResponse<T, ErrorHttp> & {
  errorMessages?: ErrorMessage[];
};
export type SWRMiddleware<T> = Middleware;

export const REQUEST_BASE_OPTIONS = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
};

export const SWR_BASE_CONFIG: SWRConfiguration = {
  // reduce re-renders when clicking on a component
  revalidateOnFocus: false,
  revalidateOnMount: true
  // revalidateIfStale: false
};

const getContentType = (headers: HeadersInit | undefined) =>
  headers ? new Headers(headers).get('Content-Type') : undefined;

// no typing for error limitation https://github.com/microsoft/TypeScript/issues/6283#issuecomment-240804072
export const getRequest: Fetcher = async (url, options = {}) => {
  // flag specific for testing with happy-dom
  // NOTE - in browser, process.env is undefined so only check in vitest/jest env (for headless browser, rethink)
  const isTestingInHappyDom = import.meta.env.MODE === 'test' && !!process?.env?.NODE_HAPPY_DOM;

  const isImage = getContentType(options?.headers)?.startsWith('image/') ?? false;

  if (isImage) {
    return (await getBlob(url, options)) as Awaited<ReturnType<Fetcher>>;
  }
  const { headers: _h, ...base } = REQUEST_BASE_OPTIONS;
  const res = await fetch(url, merge({}, base, options) as RequestInit);
  if (options?.debug) {
    // eslint-disable-next-line no-console
    console.log('getRequest', { isTestingInHappyDom, isImage, url }, res);
  }
  // 200 response
  /* c8 ignore next 8 */
  if (res.ok) {
    return !isTestingInHappyDom ? await res?.json() : res;
  }
  // very hard to test error handling
  const error: ErrorHttp = new Error(res.statusText); // non-2xx HTTP responses into errors
  // flag specific for testing with happy-dom and avoid json parsing for 400+ codes
  error.info = await res?.[!isTestingInHappyDom && res.status < 400 ? 'json' : 'text']();
  error.message = error.message || String(error.info ?? '');
  error.status = res.status;
  // return something instead of throwing error so that down the line, we can process all errors in 1 place
  return error as Awaited<ReturnType<Fetcher>>;
};

export const getRequests = async <T>(urls: string[], options?: RequestOptions): Promise<T> =>
  (await Promise.all(urls.map((url) => getRequest(url, options)))) as T;

export const getBlob = async (url: string, options: RequestOptions = {}): Promise<Blob | ErrorHttp> => {
  const { headers: _h, ...base } = REQUEST_BASE_OPTIONS;
  const res = await fetch(url, merge({}, base, options) as RequestInit);
  if (options?.debug) {
    // eslint-disable-next-line no-console
    console.log('getBlob', { url }, res);
  }
  // 200 response
  /* c8 ignore next 8 */
  if (res.ok) {
    return res.blob();
  }
  // very hard to test error handling
  const error: ErrorHttp = new Error(res.statusText); // non-2xx HTTP responses into errors
  error.info = await res.blob();
  error.status = res.status;
  return error;
};

export const postRequest = <T>(url: string, options: RequestOptions = {}) =>
  getRequest<T>(
    url,
    merge(
      {
        method: 'POST',
        ...REQUEST_BASE_OPTIONS
      },
      options
    )
  );

export const putRequest = <T>(url: string, options: RequestOptions = {}) =>
  getRequest<T>(
    url,
    merge(
      {
        method: 'PUT',
        ...REQUEST_BASE_OPTIONS
      },
      options
    )
  );

export const deleteRequest = <T>(url: string, options: RequestOptions = {}) =>
  getRequest<T>(
    url,
    merge(
      {
        method: 'DELETE',
        ...REQUEST_BASE_OPTIONS
      },
      options
    )
  );

export const useGet = <T>(key: Key, config: SWRConfiguration = {}) =>
  useSWR<T, ErrorHttp>(key, getRequest<T>, {
    ...SWR_BASE_CONFIG,
    ...config
  }) as SWRResponseWithErrors<T>;

export const useGets = <T>(key: Key[], config: SWRConfiguration = {}) =>
  useSWR<T, ErrorHttp>(key as Key, (urls: string[]) => getRequests<T>(urls), {
    ...SWR_BASE_CONFIG,
    ...config
  }) as SWRResponseWithErrors<T>;

export const useMutation = <T, T1>(
  key: Key,
  options: RequestOptions,
  config?: SWRMutationConfiguration<T, ErrorHttp, Key, T1>
) => {
  return useSWRMutation<T, ErrorHttp, Key, T1>(
    key,
    (u: Key, { arg }: { arg: T1 }) => {
      let finalUrl: string;
      const initialConfig: RequestOptions = {};
      if (isPlainObject(u)) {
        const { url, ...args } = u as { url?: string } & RequestOptions;
        finalUrl = url ?? '';
        merge(initialConfig, args);
      } else {
        const [url, ...args] = Array.isArray(u) ? u : [u];
        finalUrl = String(url ?? '');
        merge(initialConfig, ...args.filter((x) => isPlainObject(x)));
      }
      return getRequest<T>(
        finalUrl,
        merge(initialConfig, arg ? { body: stringify(arg) } : {}, options, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      );
    },
    config
  );
};

type LoggerMiddleware = {
  <T>(useSWRNext: SWRHook): ReturnType<Middleware>;
  stdoutMessagePrefix: string;
};

export const logger = ((useSWRNext: SWRHook) =>
  <T>(key: Key, fetcher: BareFetcher<T> | null, config: SWRConfiguration<T, ErrorHttp>) =>
    useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<BareFetcher<T>>) => {
        // eslint-disable-next-line no-console
        console.log('SWR Request:', key, fetcher, config);
        return fetcher ? fetcher(...args) : (undefined as T);
      },
      config
    )) as LoggerMiddleware;
logger.stdoutMessagePrefix = 'SWR Request:';

export const createHeaderMiddleware = <T>(headers: RequestInit['headers']) =>
  ((useSWRNext) => (key, fetcher, config) => {
    const typedFetcher = fetcher as unknown as BareFetcher<T> | null;
    return useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<BareFetcher<T>>) =>
        typedFetcher
          ? typedFetcher(
              args[0],
              merge(
                {
                  headers
                },
                args[1] ?? {}
              )
            )
          : (undefined as T),
      config as unknown as SWRConfiguration<T, ErrorHttp, BareFetcher<T>>
    );
  }) as SWRMiddleware<T>;

const _defaultIsValid = <T>(_d: T) => true;

export const validateResponse = <T>(
  data: unknown,
  error: ErrorHttp | null | undefined,
  isValid: (d: T) => boolean = _defaultIsValid<T>,
  sampleData?: T
) => {
  // TODO - revise error handling logic to be cleaner
  const errorMessages: ErrorMessage[] = [];

  if (!isValid(data as T)) {
    const { status = '--', info } = (data ?? {}) as ErrorHttp;
    const { message, error: responseError } = isPlainObject(info)
      ? (info as { message?: unknown; error?: unknown })
      : {};
    const errorMsg = message ?? responseError;
    if (errorMsg) {
      errorMessages.push({
        title: 'Unexpected error',
        status,
        message: errorMsg,
        ...(!import.meta.env.PROD ? { objects: [data] } : {})
      });
    } else {
      errorMessages.push({
        title: 'Invalid data',
        status,
        ...(!import.meta.env.PROD
          ? {
              objects: [
                {
                  expected: sampleData,
                  actual: data
                }
              ]
            }
          : {})
      });
    }
  }

  return errorMessages;
};
/**
 * validate API responses and return well-formed error messages
 *
 * @param isValid
 * @param defaultValue
 * @returns
 */
export const createValidationMiddleware = <T>(
  isValid: (d: T) => boolean = _defaultIsValid<T>,
  defaultValue = undefined as T
) =>
  ((useSWRNext) => (key, fetcher, config) => {
    const typedFetcher = fetcher as unknown as BareFetcher<T> | null;
    const { data, error, ...rest } = useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<BareFetcher<T>>) =>
        typedFetcher ? typedFetcher(...args) : (undefined as T),
      config as unknown as SWRConfiguration<T, ErrorHttp, BareFetcher<T>>
    );
    const errorMessages = validateResponse<T>(data, error, isValid, defaultValue);
    return {
      data: errorMessages.length ? defaultValue : data,
      error: errorMessages.length ? data : error,
      errorMessages,
      ...rest
    } as const;
  }) as SWRMiddleware<T>;

const noOp = <T>(x: T) => x;
/**
 * transform API responses
 *
 * @param fn transformer function
 * @returns <T>
 */
export const createTransformerMiddleware = <T>(fn: (x: T) => T = noOp) =>
  ((useSWRNext) => (key, fetcher, config) => {
    const typedFetcher = fetcher as unknown as BareFetcher<T> | null;
    const { data, ...rest } = useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<BareFetcher<T>>) =>
        typedFetcher ? typedFetcher(...args) : (undefined as T),
      config as unknown as SWRConfiguration<T, ErrorHttp, BareFetcher<T>>
    );
    return {
      data: typeof data === 'undefined' ? data : fn(data),
      ...rest
    } as const;
  }) as SWRMiddleware<T>;
