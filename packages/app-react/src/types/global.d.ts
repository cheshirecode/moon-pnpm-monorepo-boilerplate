import type { FC, PropsWithChildren } from 'react';

export {};

declare global {
  interface BaseProps extends PropsWithChildren<unknown> {
    className?: string;
    ['data-testid']?: string;
  }

  type BaseFC = FC<BaseProps>;

  export interface ErrorHttp extends Error {
    response?: unknown;
    info?: unknown;
    status?: number;
  }

  export type FetchResponse<R, E> = [R | undefined, Promise<E> | undefined];
}
