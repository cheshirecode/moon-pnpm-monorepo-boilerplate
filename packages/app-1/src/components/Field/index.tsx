import styled from '@emotion/styled';
import cx from 'classnames';
import { escapeRegExp, isFunction } from 'lodash-es';
import { Fragment } from 'react';

// import { timeout } from '@/utils';

import { FieldProps } from './typings';
import useField from './useField';

const StyledButton = styled.button``;

const Field = (props: FieldProps) => {
  const {
    fieldRef,
    v,
    onAutoCompleteItemClicked,
    onChange,
    setValue,
    isEditing,
    onKeyUp,
    onBlur,
    onFocus,
    readOnlyProps,
    filteredAutoCompleteItems,
    noConfirmation
  } = useField(props);
  const {
    value: originalValue,
    onBlur: _ob,
    saveOnBlur: _s,
    set: _set,
    onChange: _onChange,
    className,
    displayValue,
    inputClassName,
    iconClassName,
    name,
    title,
    readOnly,
    readOnlyClassName,
    autoCompleteItems: _a,
    autoCompletePos = 'absolute',
    autoCompleteClassName,
    filterByValue: _f,
    noConfirmation: _n,
    idPrefix = '--poc-field-',
    ...rest
  } = props;

  const fullAutoCompleteClassName = cx(
    autoCompletePos === 'absolute' && 'absolute z-3',
    autoCompletePos === 'relative' && 'relative flex flex-col',
    'm-0 p-0 py-2 w-full max-h-40 overflow-y-auto',
    'card-secondary',
    autoCompleteClassName
  );
  const filteredItems = filteredAutoCompleteItems ?? [];

  return (
    <div
      className={cx('relative children:(my-auto)', 'h-full w-full', isEditing && 'z-1', className)}
      ref={fieldRef}
      onFocus={onFocus}
      {...rest}
    >
      <input
        id={`${idPrefix}${name}`}
        name={name}
        className={cx(
          'py-0 pl-2 ',
          noConfirmation ? 'pr-2' : 'pr-8',
          'min-h-6',
          'h-full w-full',
          'border border-transparent',
          '@hover:(border-primary)',
          !readOnly && inputClassName,
          !readOnly && 'card-secondary',
          !readOnly && !isEditing && 'cursor-pointer',
          readOnly && readOnlyClassName,
          readOnly && 'card-primary pointer-events-none'
        )}
        type="text"
        value={isEditing ? v : isFunction(displayValue) ? displayValue(v) : v}
        placeholder={title}
        onChange={onChange}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        {...readOnlyProps}
      />
      {!readOnly && !noConfirmation && (
        <StyledButton
          onClick={setValue}
          className={cx(
            !isEditing && 'btn-transparent z--1',
            isEditing && 'btn-primary cursor-pointer @hover:animate-pulse z-2',
            'inline-block absolute right-0',
            'items-center',
            'h-full px-2 lh-0',
            iconClassName
          )}
          title="Click to confirm changes, or press Enter"
        >
          ✓
        </StyledButton>
      )}
      {isEditing && (
        <Fragment>
          {filteredItems.length > 0 && (
            <section
              className={cx(
                fullAutoCompleteClassName,
                'children:(w-full inline-block border-0)',
                'animate-duration-200 animate-fade-in'
              )}
            >
              {filteredItems.map(({ name, value }) => {
                const splits = name.split(new RegExp(`(${escapeRegExp(String(v))})`, 'gi'));
                return (
                  <button
                    key={name}
                    className={cx(
                      'bg-inherit',
                      // value !== v ? 'cursor-pointer anchor hover:bg-primary-hover' : 'disabled'
                      value !== originalValue
                        ? 'cursor-pointer anchor hover:bg-primary-hover'
                        : 'disabled'
                    )}
                    data-value={value}
                    onClick={onAutoCompleteItemClicked}
                    onKeyUp={onKeyUp}
                  >
                    {splits.map((x, i) =>
                      x.toLocaleLowerCase() === String(v).toLocaleLowerCase() ? (
                        <span className={cx('bg-warning')} key={i}>
                          {x}
                        </span>
                      ) : (
                        x
                      )
                    )}
                  </button>
                );
              })}
            </section>
          )}
          {filteredItems.length === 0 && (
            <section className={cx(fullAutoCompleteClassName, 'px-2')}>No items...</section>
          )}
        </Fragment>
      )}
    </div>
  );
};

export default Field;
