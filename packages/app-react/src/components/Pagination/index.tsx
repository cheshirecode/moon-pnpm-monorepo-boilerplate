import cx from 'classnames';
import { Fragment } from 'react';

import Field from '@/components/Field';

import type { PaginationProps } from './typings';
import usePagination from './usePagination';

export const PlainPagination = ({
  // skip those from internal hook
  children: _children,
  onChange: _onChange,
  setParams: _setParams,
  setPageSize,
  pageSize,
  pageSizes,
  first,
  last,
  count,
  // necessary props
  className,
  itemClassName,
  activeItemClassName,
  disabledItemClassName,
  page,
  pageNumbers,
  maxPage,
  onPageNumberClick,
  isRollover,
  isPrevPossible,
  goPrevious,
  isNextPossible,
  goTo: _g,
  goNext,
  goFirst,
  goLast,
  goToAttempt,
  showAllPages = false,
  isPaginationRedundant,
  // DOM-only props
  ...props
}: PaginationProps) => {
  if (isPaginationRedundant) {
    return null;
  }
  return (
    <section
      className={cx(
        'flex flex-gap-2 justify-end',
        'w-full mx-auto my-2 min-h-10 h-10',
        'children:(p-2 transition-all-200)',
        className
      )}
      {...props}
    >
      <span className="color-tertiary">Page size</span>
      <select
        className="ml-2 h-inherit card-secondary"
        onChange={(e) => setPageSize(~~e.currentTarget.value)}
        value={~~pageSize}
      >
        {pageSizes.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span className="">{`${first + 1} - ${last + 1} of ${count}`}</span>
      {maxPage > 1 && (
        <Fragment>
          <button
            key="first"
            tabIndex={0}
            onClick={goFirst}
            disabled={!isPrevPossible && !isRollover}
            className={cx(
              'btn-secondary',
              !isPrevPossible && !isRollover && cx('disabled opacity-30', disabledItemClassName),
              itemClassName
            )}
          >
            {'<<'}
          </button>
          <button
            key="prev"
            tabIndex={0}
            onClick={goPrevious}
            disabled={!isPrevPossible && !isRollover}
            className={cx(
              'btn-secondary',
              !isPrevPossible && !isRollover && cx('disabled opacity-30', disabledItemClassName),
              itemClassName
            )}
          >
            {'<'}
          </button>
          {!showAllPages && (
            <Field
              name="--pagination-page"
              value={String(page)}
              title="Click to change page"
              displayValue={(v) => `${v} / ${maxPage}`}
              set={goToAttempt}
              className={cx('uno-layer-o:(w-fit h-full my-auto py-0 inline-block)')}
              inputClassName="uno-layer-o:w-10ch"
              noConfirmation
              saveOnBlur
              readOnly={maxPage <= 1}
            />
          )}
          {showAllPages &&
            pageNumbers.map((v) => (
              <button
                key={v}
                tabIndex={0}
                data-id={v}
                onClick={onPageNumberClick}
                disabled={v === page}
                className={cx(
                  'btn-secondary',
                  v === page && cx('bg-secondary disabled opacity-30', activeItemClassName),
                  itemClassName
                )}
              >
                {v}
              </button>
            ))}
          <button
            key="next"
            tabIndex={0}
            onClick={goNext}
            disabled={!isNextPossible && !isRollover}
            className={cx(
              'btn-secondary',
              !isNextPossible && !isRollover && cx('disabled opacity-30', disabledItemClassName),
              itemClassName
            )}
          >
            {'>'}
          </button>
          <button
            key="last"
            tabIndex={0}
            onClick={goLast}
            disabled={!isNextPossible && !isRollover}
            className={cx(
              'btn-secondary',
              !isNextPossible && !isRollover && cx('disabled opacity-30', disabledItemClassName),
              itemClassName
            )}
          >
            {'>>'}
          </button>
        </Fragment>
      )}
    </section>
  );
};

const Pagination = (props: PaginationProps) => {
  const extraProps = usePagination(props);

  return <PlainPagination {...props} {...extraProps} />;
};

export default Pagination;
