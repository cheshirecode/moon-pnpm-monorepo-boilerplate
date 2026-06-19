import { isEqual, isFunction } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import usePrevious from '@/services/hooks/usePrevious';
import { getIntervals } from '@/utils';

import type { PaginationHookParams, PaginationHookResults, PaginationParams } from './typings';

export const DEFAULT_PAGINATION_THRESHOLD = 10;
export const DEFAULT_PAGE_SIZE_COUNTS = 3;

/**
 * main logic to generate pagination parameters with clamped internvals and resolved page values
 *
 * @param param0
 * @returns
 */
const createNewParams: (
  p: PaginationHookParams
) => PaginationParams & Required<Pick<PaginationHookParams, 'page'>> = ({
  page,
  count,
  pageSize,
  _pageSize = 0,
  pageSizeCount
}) => {
  if (count < 0) {
    // eslint-disable-next-line no-console
    console.error('pageSize', pageSize, 'count', count);
    throw RangeError('invalid props, both pageSize and count need to be integers');
  }
  /**
   * pageSize is +ve integer, use it
   * pageSize === false - use the full list
   * pageSize !== false and not +ve integer, take the 1st page size option
   * */
  const resolvedPageSize = ~~pageSize;
  const maxSize = Math.max(count, resolvedPageSize, DEFAULT_PAGINATION_THRESHOLD);
  const intervalValues = [resolvedPageSize, Number(_pageSize), DEFAULT_PAGINATION_THRESHOLD].filter(
    (x) => Number.isFinite(x) && x > 0
  );
  const pageSizes = [
    ...new Set(
      getIntervals(
        getIntervals([], maxSize).concat(intervalValues),
        [DEFAULT_PAGINATION_THRESHOLD, maxSize],
        pageSizeCount
      )
    )
  ];
  const finalPageSize =
    pageSizes.find((x) => x === resolvedPageSize) ||
    pageSizes.find((x) => x === _pageSize) ||
    pageSizes[0] ||
    DEFAULT_PAGINATION_THRESHOLD;

  const maxPage = finalPageSize ? Math.max(Math.ceil(count / finalPageSize), 1) : 0;
  const newPage = Math.max(Math.min(~~page, maxPage), 1);
  const first = Math.min((newPage - 1) * finalPageSize, count);
  const last = Math.max(Math.min(count, first + finalPageSize) - 1, maxPage ? 1 : 0);
  return {
    page: newPage,
    count,
    last,
    first,
    maxPage,
    pageNumbers: Array(maxPage)
      .fill(0)
      .map((_v, i) => i + 1),
    pageSize: finalPageSize,
    pageSizes
  } as const;
};

const usePagination: (p: PaginationHookParams) => PaginationHookResults = (props) => {
  const {
    page: initialPage = 1,
    pageSize,
    pageSizeCount: _pageSizeCount,
    count,
    onChange,
    isRollover = false
  } = props ?? {};
  const pageSizeCount = useMemo(
    () => DEFAULT_PAGE_SIZE_COUNTS + Math.max(1, Math.ceil(Math.log10(count))),
    [count]
  );
  const [innerParams, setInnerParams] = useState(
    createNewParams({
      page: initialPage,
      count,
      pageSize,
      _pageSize: Number(pageSize),
      pageSizeCount
    })
  );
  const prevPageSize = usePrevious(innerParams?.pageSize);
  const setParams = useCallback<PaginationHookResults['setParams']>(
    (params) => {
      // need to re-create new params based on inputs thus onChange needs to be called inside
      setInnerParams((p) => {
        const newParams = createNewParams({
          ...p,
          ...params,
          _pageSize: Number(prevPageSize),
          pageSizeCount
        });
        // skip updates if no new chanages
        if (isEqual(p, newParams)) {
          return p;
        }
        if (isFunction(onChange)) {
          onChange(newParams);
        }
        return newParams;
      });
    },
    [onChange, pageSizeCount, prevPageSize]
  );

  const helpers: PaginationHookResults = useMemo(() => {
    const goTo = (page: number) => {
      setParams({ page });
    };
    const { page, maxPage, pageNumbers, pageSizes } = innerParams;

    return {
      ...innerParams,
      setParams,
      isNextPossible: isRollover || page < maxPage,
      isPrevPossible: isRollover || page > 1,
      isRollover,
      isPaginationRedundant: !pageSizes?.length || count <= pageSizes[0],
      onPageNumberClick: (e) => setParams({ page: Number(e.currentTarget.dataset.id) }),
      goTo,
      goToAttempt: (v: unknown) => {
        const newV = pageNumbers.find((x) => x === Number(v)) ?? pageNumbers[0];
        goTo(newV);
        return newV;
      },
      goPrevious: () => {
        setParams({ page: page <= 1 ? maxPage : page - 1 });
      },
      goNext: () => {
        setParams({ page: page >= maxPage ? 1 : page + 1 });
      },
      goFirst: () => goTo(1),
      goLast: () => goTo(maxPage),
      setPageSize: (pageSize: number) => setParams({ pageSize: ~~pageSize })
    };
  }, [innerParams, setParams, isRollover, count]);

  useEffect(() => {
    helpers.goTo(initialPage);
    setParams({
      page: initialPage,
      count,
      pageSize
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage, count, pageSize]);

  return helpers;
};

export default usePagination;
