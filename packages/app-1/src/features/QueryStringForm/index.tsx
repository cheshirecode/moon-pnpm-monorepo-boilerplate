import cx from 'classnames';
import { isFunction, mergeWith } from 'lodash-es';
import { useMemo } from 'react';

import Details from '@/components/Details';
import Field from '@/components/Field';

import type { DetailsData } from '@/components/Details/typings';
import type { QueryStringFormProps } from './typings';
import useQueryStringForm from './useQueryStringForm';

const QueryStringForm = <T extends DetailsData>(props: QueryStringFormProps<T>) => {
  const {
    className,
    onQsChange,
    metadata = {},
    fieldPropsByKey,
    bigText,
    heading = '',
    ...rest
  } = props;
  const { createSetter } = useQueryStringForm(props);

  const finalMetadata = useMemo(() => {
    const fieldRenderer = (v: unknown, { k }: { k: string }) => {
      const value = typeof v === 'number' || typeof v === 'string' ? v : String(v ?? '');
      const finalFieldProps = {
        saveOnBlur: true,
        noConfirmation: true,
        set: createSetter(k),
        ...(onQsChange ? {} : { readOnly: true }),
        ...(isFunction(fieldPropsByKey) ? fieldPropsByKey(k) : {})
      };
      return <Field idPrefix="-poc-qs-field-" name={k} value={value} {...finalFieldProps} />;
    };
    const baseMetadata = {
      '*': {
        label: {
          className: 'uppercase h-9',
          renderAsLabel: '-poc-qs-field-'
        },
        field: {
          className: 'h-9',
          render: fieldRenderer
        }
      }
    } as QueryStringFormProps<T>['metadata'];
    return mergeWith(baseMetadata, metadata, (objValue, srcValue, key) => {
      if (key === 'className') {
        return cx(objValue, srcValue);
      }
    });
  }, [createSetter, fieldPropsByKey, metadata, onQsChange]);

  return (
    <Details<T>
      {...rest}
      className={cx(className)}
      responsiveGrid="grid md:(responsive-grid-kv)"
      labelClassName={cx(
        '',
        'color-secondary opacity-60 flex justify-end lt-md:(justify-start)',
        bigText && 'items-center',
        bigText && 'font-gs-body01'
      )}
      fieldClassName={cx('', bigText && 'font-gs-body01')}
      heading={heading}
      metadata={finalMetadata}
    />
  );
};

export default QueryStringForm;
