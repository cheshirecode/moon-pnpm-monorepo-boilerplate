import stringify from 'fast-json-stable-stringify';
import { isPlainObject, merge } from 'lodash-es';
import type { Key, SWRConfiguration, SWRHook, SWRResponse } from 'swr';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

type RequestOptions = RequestInit & {
  debug?: boolean;
};

export type Fetcher = <T>(url: string, options?: RequestOptions) => Promise<T>;
export type SWRMiddleware<T> = (
  useSWRNext: SWRHook
) => (key: Key, fetcher: Fetcher, config?: SWRConfiguration) => SWRResponse<T, ErrorHttp>;

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

// no typing for error limitation https://github.com/microsoft/TypeScript/issues/6283#issuecomment-240804072
export const getRequest: Fetcher = async (url, options = {}) => {
  // flag specific for testing with happy-dom
  // NOTE - in browser, process.env is undefined so only check in vitest/jest env (for headless browser, rethink)
  const isTestingInHappyDom = import.meta.env.MODE === 'test' && !!process?.env?.NODE_HAPPY_DOM;

  const isImage = options?.headers ? options?.headers['Content-Type']?.startsWith('image/') : false;

  if (isImage) {
    return getBlob(url, options);
  }
  const { headers: _h, ...base } = REQUEST_BASE_OPTIONS;
  // @ts-expect-error
  const res = await fetch(url, merge({}, base, options));
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
  error.message = error.message || error.info;
  error.status = res.status;
  // return something instead of throwing error so that down the line, we can process all errors in 1 place
  return error;
};

export const getRequests: <T>(urls: string[], options?: RequestOptions) => Promise<T>[] = async (
  urls,
  options
) => {
  return await Promise.all(urls.map((url) => getRequest(url, options)));
};

export const getBlob: Fetcher = async (url, options = {}) => {
  const { headers: _h, ...base } = REQUEST_BASE_OPTIONS;
  // @ts-expect-error
  const res = await fetch(url, merge({}, base, options));
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
  });

export const useGets = <T>(key: Key[], config: SWRConfiguration = {}) =>
  useSWR<T, ErrorHttp>(key, getRequests<T>, {
    ...SWR_BASE_CONFIG,
    ...config
  });

export const useMutation = <T, T1>(key: Key, options: RequestOptions, config?: SWRConfiguration) => {
  return useSWRMutation<T, ErrorHttp, Key, T1>(
    key,
    (u: Key, { arg } = {}, o: RequestInit) => {
      let finalUrl;
      const initialConfig = {};
      if (isPlainObject(u)) {
        const { url, ...args } = u;
        finalUrl = url;
        merge(initialConfig, args);
      } else {
        const [url, ...args] = Array.isArray(u) ? u : [u];
        finalUrl = url;
        merge(initialConfig, ...args.filter((x) => isPlainObject(x)));
      }
      return getRequest<T>(
        finalUrl,
        merge(initialConfig, arg ? { body: stringify(arg) } : {}, options, o, {
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

export const logger =
  <T>(useSWRNext: SWRHook) =>
  (key: Key, fetcher: Fetcher, config?: SWRConfiguration) =>
    useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<Fetcher>) => {
        // eslint-disable-next-line no-console
        console.log('SWR Request:', key, fetcher, config);
        return fetcher<T>(...args);
      },
      config
    );
logger.stdoutMessagePrefix = 'SWR Request:';

export const createHeaderMiddleware = <T>(headers: RequestInit['headers']) =>
  ((useSWRNext) => (key, fetcher, config) =>
    useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<Fetcher>) =>
        fetcher<T>(
          args[0],
          merge(
            {
              headers
            },
            args[1] ?? {}
          )
        ),
      config
    )) as SWRMiddleware<T>;

const _defaultIsValid = <T>(_d: T) => true;

export const validateResponse = <T>(
  data: T | ErrorHttp,
  error: ErrorHttp | undefined,
  isValid: (d: T) => boolean = _defaultIsValid<T>,
  sampleData: T
) => {
  // TODO - revise error handling logic to be cleaner
  const errorMessages = [];

  if (!isValid(data)) {
    const { status = '--', info: { message, error } = {} } = data ?? {};
    const errorMsg = message ?? error;
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
  defaultValue: T
) =>
  ((useSWRNext) => (key, fetcher, config) => {
    const { data, error, ...rest } = useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<Fetcher>) => fetcher<T>(...args),
      config
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
    const { data, ...rest } = useSWRNext<T, ErrorHttp>(
      key,
      (...args: Parameters<Fetcher>) => fetcher<T>(...args),
      config
    );
    return {
      data: fn(data),
      ...rest
    } as const;
  }) as SWRMiddleware<T>;
