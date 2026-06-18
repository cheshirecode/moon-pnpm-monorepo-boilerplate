/* eslint-disable no-useless-escape */
import styled from '@emotion/styled';
import cx from 'classnames';
import { isFunction, isUndefined, noop, throttle } from 'lodash-es';
import type { ChangeEvent, ComponentType, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Props } from 'react-select';

import Spinner from '@/components/Spinner';
import useClickOutside from '@/services/hooks/useClickOutside';

type SearchOption = {
  name: string;
  value: string;
  disabled?: boolean;
};

const LazySelect = lazy(() => import('react-select')) as ComponentType<Props<SearchOption, false>>;

const isDevMode = import.meta.env.DEV;

const Select = (props: Props<SearchOption, false>) => (
  <Suspense fallback={<Spinner />}>
    <LazySelect {...props} />
  </Suspense>
);

export const AbsoluteSelect = styled(Select)`
  position: absolute;
`;

export type SearchBarProps = BaseProps & {
  update?: (v: string) => void;
  submit?: (v: string) => void;
  placeholder?: string;
  searchButtonText?: string;
  searchButtonClassName?: string;
  value: string;
  borders?: boolean;
  roundedBorders?: boolean;
  inputClassName?: string;
  searchIcon?: boolean;
  autoCompleteItems?: {
    name: string;
    value: string;
  }[];
  onAutoCompleteItemClicked?: (v: string) => void;
  selectedOptionValue?: string;
  options?: SearchOption[];
  onOptionChange?: (v: string) => void;
  containerClassName?: string;
  focus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  /**
   * if true, use react-select instead of native <select>
   */
  customSelect?: boolean;
  /**
   * compact mode
   */
  compact?: boolean;
};

const SearchBar = ({
  className,
  inputClassName,
  value,
  placeholder = '',
  searchButtonText = 'Search',
  searchButtonClassName,
  update = noop,
  submit = noop,
  borders = true,
  roundedBorders = false,
  searchIcon = true,
  autoCompleteItems = [],
  onAutoCompleteItemClicked: _onAutoCompleteItemClicked = noop,
  containerClassName,
  focus = false,
  inputRef,
  selectedOptionValue,
  options = [],
  onOptionChange = noop,
  customSelect = false,
  compact = false,
  ...props
}: SearchBarProps) => {
  const updateValue = useMemo(
    () =>
      throttle(
        (v) => {
          if (isFunction(update)) {
            update(v);
          }
        },
        50,
        {
          trailing: true,
          leading: true
        }
      ),
    [update]
  );
  // ref for clicking outside
  const fieldRef = useRef<HTMLDivElement>(null);
  // if clicking outside, set flag to hide unless with autocompletion, then save first
  useClickOutside(fieldRef, () => {
    setAutoComplete(false);
  });

  const onAutoCompleteItemClicked = useMemo<
    (e: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) => void
  >(
    () => (e) => {
      const tmp = e.currentTarget?.dataset?.value;
      const key = 'key' in e ? e.key : undefined;
      if ((!key || key === 'Enter') && tmp) {
        _onAutoCompleteItemClicked(tmp);
      }
      if (!key || key === 'Escape') {
        setAutoComplete(false);
      }
    },
    [_onAutoCompleteItemClicked]
  );

  const [autoComplete, setAutoComplete] = useState(false);
  const showAutoComplete = useCallback(() => setAutoComplete(true), []);
  const isShowingAutoComplete = useMemo(
    () => autoComplete && autoCompleteItems.length > 0,
    [autoCompleteItems.length, autoComplete]
  );

  const submitSearch = () => {
    if (isFunction(submit)) {
      submit(value);
    }
  };

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitSearch();
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget?.value;
    if (!isUndefined(v)) {
      setAutoComplete(true);
      updateValue(v);
    }
  };

  const onKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setAutoComplete(false);
    }
    if (e.key === 'Enter') {
      submitSearch();
    }
    const v = e.currentTarget?.value;
    if (!isUndefined(v)) {
      setAutoComplete(true);
      updateValue(v);
    }
  };

  const selectedOption = useMemo(() => {
    const o = options.find((x) => x.value === selectedOptionValue);
    return o
      ? {
          ...o,
          label: o?.name
        }
      : o;
  }, [options, selectedOptionValue]);

  useEffect(() => {
    if (focus) {
      fieldRef.current?.querySelector('input')?.focus();
    }
  }, [focus]);

  return (
    <article className={cx('relative', 'font-gs-body01', containerClassName)} ref={fieldRef}>
      <section
        className={cx(
          'inline-flex justify-center sm:justify-end items-center',
          'w-full',
          className
        )}
        {...props}
      >
        {searchIcon && (
          <span
            aria-hidden="true"
            className={cx(
              'h-full absolute z-3',
              compact ? 'left-2' : 'left-4',
              'flex justify-center items-center',
              'border-primary'
            )}
          >🔎</span>
        )}
        {options.length > 0 && customSelect && (
          <AbsoluteSelect
            className={cx(
              'left-12 z-3 h-full w-32',
              // this has to be written as such for higher specificity than the CSS classes generated by react-select
              // need to escape with \\ in dev and \ for prod due to https://github.com/unocss/unocss/issues/2731
              /* prettier-ignore */
              isDevMode ? 'all-[.react-select\_\_control]:(card-primary border-l-transparent rounded-none h-full my-auto)' : 'all-[.react-select\\_\\_control]:(card-primary border-l-transparent rounded-none h-full my-auto)',
              /* prettier-ignore */
              isDevMode ? 'all-[.react-select\_\_control]:@hover:(card-primary-hover)' : 'all-[.react-select\\_\\_control]:@hover:(card-primary-hover)',
              'all-[#react-select-3-listbox]:(card-primary rounded-none)'
            )}
            classNamePrefix="react-select"
            classNames={{
              // valueContainer: () => 'color-primary',
              // singleValue: () => 'color-primary',
              // TODO - figure out higher specificity for non-hover state
              option: () => 'uno-layer-o:(py-2 border-0 card-primary)'
            }}
            options={options.map(({ name, value, ...rest }) => ({
              name,
              value,
              label: name,
              ...rest
            }))}
            value={selectedOption}
            onChange={(v) => {
              if (v) {
                onOptionChange(v.value);
              }
            }}
            isOptionDisabled={(option) => !!option.disabled}
          />
        )}
        {options.length > 0 && !customSelect && (
          <select
            className={cx(
              'absolute left-12 z-3',
              'h-full my-auto',
              'card-primary border'
              // 'uno-layer-o:(border-l-transparent)'
            )}
            value={selectedOptionValue}
            onChange={(e) => {
              onOptionChange(e.currentTarget.value);
            }}
          >
            {options.map(({ name, value }) => (
              <option className="" key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          className={cx(
            'flex-1 h-inherit',
            roundedBorders && 'rounded-6',
            roundedBorders &&
              searchButtonText?.length > 0 &&
              'uno-layer-o:(rounded-tr-none rounded-br-none)',
            roundedBorders && isShowingAutoComplete && 'uno-layer-o:(rounded-b-none)',
            compact ? 'px-2 py-1' : 'px-4 py-3',
            borders && 'uno-layer-o:(border border-cta)',
            'card-secondary',
            'z-2',
            'focus-visible:outline-none',
            searchIcon && 'pl-12',
            !searchIcon && options.length > 0 && (customSelect ? 'pl-34' : 'pl-26'),
            searchIcon && options.length > 0 && (customSelect ? 'pl-46' : 'pl-38'),
            inputClassName
          )}
          placeholder={placeholder}
          aria-label="Search"
          aria-describedby="--poc-button-search"
          onChange={onChange}
          onKeyUp={onKeyUp}
          value={value}
          onFocus={showAutoComplete}
          ref={inputRef}
        />
        {searchButtonText?.length > 0 && (
          <button
            className={cx(
              'btn bg-cta color-cta border border-cta-blend',
              'm-0 my--1',
              'z-1 uno-layer-o:(py-3)',
              roundedBorders && 'uno-layer-o:(rounded-6 rounded-tl-none rounded-bl-none)',
              !roundedBorders && 'uno-layer-o:(rounded-none)',
              searchButtonClassName
            )}
            id="--poc-button-search"
            onClick={onClick}
          >
            {searchButtonText}
          </button>
        )}
      </section>
      {isShowingAutoComplete && (
        <section
          className={cx(
            'absolute z-3',
            // autoCompletePos === 'relative' && 'relative flex flex-col',
            'm-0 p-0 py-2 w-full max-h-40 overflow-y-auto',
            'border card-primary',
            'children:(w-full inline-block border-0 )',
            'animate-duration-200 animate-fade-in'
          )}
        >
          {autoCompleteItems.map(({ name, value }) => {
            return (
              <button
                key={name}
                className={cx(
                  'bg-inherit',
                  'cursor-pointer anchor hover:bg-primary-hover',
                  'text-left'
                )}
                data-value={value}
                onClick={onAutoCompleteItemClicked}
                onKeyUp={onAutoCompleteItemClicked}
              >
                {name}
              </button>
            );
          })}
        </section>
      )}
    </article>
  );
};

export default SearchBar;
