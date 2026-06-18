import { isFunction } from 'lodash-es';
import { useMemo } from 'react';

import createUrlSearchParams from '@/services/routes/createUrlSearchParams';

import type { DetailsData } from '@/components/Details/typings';
import { QueryStringFormProps } from './typings';

const useQueryStringForm = <T extends DetailsData>({
  onQsChange,
  onKeyValueChange,
  onParamsChange,
  data
}: QueryStringFormProps<T>) => {
  const { q, createSetter } = useMemo(() => {
    const q = createUrlSearchParams('', data);
    return {
      q,
      // last write wins - k=0&k1=1&k2=2&k=3 > {k: '3', k1: '1', k2: '2'}
      createSetter: (k: string) => (v: string | number) => {
        q.set(k, String(v));
        if (isFunction(onQsChange)) {
          onQsChange(q.toString());
        }
        if (isFunction(onKeyValueChange)) {
          onKeyValueChange(k, v);
        }
        if (isFunction(onParamsChange)) {
          onParamsChange(q.entriesAsObj());
        }
      }
    };
  }, [data, onKeyValueChange, onParamsChange, onQsChange]);

  return {
    q,
    createSetter
  } as const;
};

export default useQueryStringForm;
