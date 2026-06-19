import styled from '@emotion/styled';
import cx from 'classnames';
import { isEmpty, isFunction, isPlainObject, isString, mergeWith } from 'lodash-es';
import { Fragment, useState } from 'react';

import Card from '@/components/Card';
import createOnClickCopyToClipboard from '@fieryeagle/browser-clipboard';
import { isEmptyObject } from '@/utils';

import type { DetailsData, DetailsMetadata, DetailsProps } from './typings';

const StyledArticle = styled.article``;
const Details = <T extends DetailsData>(props: DetailsProps<T>) => {
  const {
    className,
    contentClassName,
    labelClassName,
    fieldClassName,
    fieldCopy,
    data = {} as T,
    metadata = {} as NonNullable<DetailsProps<T>['metadata']>,
    responsiveGrid = true,
    containerQueryGrid = false,
    oneFieldPerLine,
    heading = '',
    opened: _opened = false,
    padding = true,
    border = true,
    borderPalette,
    keyFormatter,
    valueFormatter,
    children,
    ...rest
  } = props;
  const [opened, setOpened] = useState(_opened);
  const hasHeading = Boolean(heading);
  if (!children && isEmptyObject(data)) {
    return null;
  }
  return (
    <Card
      type="primary"
      className={cx(
        border && [
          'border',
          !borderPalette && 'border-primary',
          borderPalette && `border-${borderPalette}`
        ],
        'contain-content',
        '@container',
        className
      )}
    >
      {hasHeading && (
        <Card
          type="information"
          flex={false}
          hover={false}
          className={cx('flex p-1 font-gs-heading05', 'pre-wrap')}
        >
          <span className="h-fit my-auto flex-1 flex items-center">{heading}</span>
          <span
            aria-label={opened ? 'Collapse details' : 'Expand details'}
            className="my-auto ml-auto btn btn-compact btn-primary"
            onClick={() => setOpened((v) => !v)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                setOpened((v) => !v);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {opened ? '^' : '⌄'}
          </span>
        </Card>
      )}
      <StyledArticle
        className={cx(
          hasHeading && !opened && 'hidden',
          (!hasHeading || opened) &&
            (responsiveGrid === true ? 'responsive-grid-kv' : responsiveGrid),
          (!hasHeading || opened) && containerQueryGrid && '@grid-kv',
          padding && 'p-1',
          padding && responsiveGrid && 'gap-1',
          contentClassName
        )}
        {...rest}
      >
        {children ??
          (Object.keys(data) as (keyof T & string)[]).map((k) => {
            // resolution order - key > * > null
            const { label, field } = mergeWith(
              oneFieldPerLine
                ? {
                    label: {
                      className: 'col-span-1 '
                    },
                    field: {
                      className: 'col-start-2 col-end--1'
                    }
                  }
                : {},
              metadata['*'] ?? {},
              metadata[k] ?? {},
              (objValue, srcValue, key) => {
                if (key === 'className') {
                  return cx(objValue, srcValue);
                }
              }
            ) as DetailsMetadata<T>;
            const v = data[k];
            // for object or array types, requires a custom renderer
            if ((Array.isArray(v) || isPlainObject(v)) && !field?.render) {
              return null;
            }
            // localisation
            const localisedKey = isFunction(keyFormatter) ? keyFormatter(k) : k;
            const localisedValue = isFunction(valueFormatter)
              ? valueFormatter({
                  k,
                  v
                }) ?? v
              : v;

            let renderedKey = label?.render
              ? label?.render(localisedKey, { k, v }, props)
              : localisedKey;
            renderedKey =
              renderedKey && label?.renderAsLabel ? (
                <label htmlFor={`${label?.renderAsLabel}${k}`}>
                  {localisedKey}
                  {localisedKey !== renderedKey && renderedKey}
                </label>
              ) : (
                renderedKey
              );
            const renderedValue = field?.render
              ? field?.render(localisedValue, { k, v }, props)
              : localisedValue;
            const displayValue = field?.render ? '' : v?.toString();
            if ([renderedValue, renderedKey].every(isEmpty)) {
              return null;
            }
            const isFieldCopyPossible = fieldCopy && !isEmpty(displayValue);
            return (
              <Fragment key={k}>
                {label?.fullLinePre && <span className="col-span-full" />}
                <span
                  className={cx(
                    'flex',
                    (responsiveGrid || containerQueryGrid) && 'justify-end lt-xs:(justify-start)',
                    'border border-transparent',
                    'color-secondary opacity-60',
                    label?.className,
                    labelClassName
                  )}
                  {...(isString(renderedKey) ? { title: renderedKey } : {})}
                >
                  {renderedKey}
                </span>
                {field?.fullLinePre && <span className="col-span-full" />}
                <span
                  className={cx(
                    'px-1',
                    'border border-transparent',
                    'color-primary truncate',
                    field?.className,
                    isFieldCopyPossible && 'cursor-copy @hover:(border-primary)',
                    fieldClassName
                  )}
                  {...(displayValue ? { title: displayValue } : {})}
                  {...(isFieldCopyPossible
                    ? {
                        onClick: createOnClickCopyToClipboard(displayValue ?? '', {
                          preventDefault: true
                        })
                      }
                    : {})}
                >
                  {renderedValue}
                </span>
              </Fragment>
            );
          })}
      </StyledArticle>
    </Card>
  );
};

export default Details;
