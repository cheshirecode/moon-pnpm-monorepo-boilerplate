import type { MouseEvent } from 'react';

export type PaginationHookParams = {
  /**
   *  how many items in the list
   */
  count: number;
  /**
   *  index 1 for display,  first page to select, or can be used to subsequently change page
   */
  page: number;
  /**
   * provide number of items per page based on other params or can be passed in to override
   */
  pageSize: number | false;
  /**
   * how many items in page size list
   */
  pageSizeCount?: number;
  /**
   * original page size
   */
  _pageSize?: number | false;
  /**
   *
   * change callback(PAGINATION_PARAMS) whenever pagination happens
   */
  onChange?: (params: PaginationParams) => void;
  /**
   * default - true. clicking next/prev will go over the range.
   */
  isRollover?: boolean;
};

export type PaginationParams = PaginationHookParams & {
  /**
   *  index 0 for array's beginning index
   */
  last: number;
  /**
   *  index 0 for array's end index. remember to do Array.slice(first, last + 1) to include the last element
   */
  first: number;
  /**
   *  max page number
   */
  maxPage: number;
  /**
   * helper array with 1..maxPage
   */
  pageNumbers: number[];
  /**
   * page size options
   */
  pageSizes: number[];
  /**
   * setter for other params
   * @param params
   * @returns
   */
};

export type PaginationHookResults = PaginationParams & {
  setParams: (params: Partial<PaginationHookParams>) => void;
  /**
   * helper callback to render custom paginator
   */
  onPageNumberClick: (e: MouseEvent<HTMLElement>) => void;
  /**
   * go back
   */
  goPrevious: () => void;
  /**
   * go next
   */
  goNext: () => void;
  /**
   * go to page
   */
  goTo: (n: number) => void;
  /**
   * try to resolve a page (or default to first) then go to that page, returns the resolved value
   */
  goToAttempt: (n: unknown) => number;
  /**
   * go to first page
   */
  goFirst: () => void;
  /**
   * go to first page
   */
  goLast: () => void;
  /**
   * set how many items on a page
   */
  setPageSize: (n: number) => void;
  /**
   * set current page size (usually one from pageSizes)
   */
  setPageSize: (n: number) => void;
  /**
   * flag - next page is possible
   */
  isNextPossible: boolean;
  /**
   * flag - prev page is possible
   */
  isPrevPossible: boolean;
  /**
   * whether total < smallest page size (then maybe not show any pagination widgets)
   */
  isPaginationRedundant: boolean;
};

export type PaginationStyleProps = {
  itemClassName?: string;
  activeItemClassName?: string;
  disabledItemClassName?: string;
};

export type PaginationProps = BaseProps &
  PaginationHookResults &
  PaginationStyleProps & {
    /**
     * flag - default - false. TRUE to show all pages, FALSE to show current / max
     */
    showAllPages?: boolean;
  };
