import type { ColumnSort } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

export type _SortingState = (ColumnSort & {
  // overload-ed metadata
  _isNumber?: boolean; // is numeric
})[];
export type SortingHookResults = [_SortingState, Dispatch<SetStateAction<_SortingState>>];

const useSorting = (initial: _SortingState): SortingHookResults => useState(initial);

export default useSorting;
