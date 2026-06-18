import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';

export type FieldValue = string | number;
export type FieldHookParams = {
  value: FieldValue;
  onChange?: (v: FieldValue) => void | FieldValue;
  set?: (v: FieldValue) => void | FieldValue;
  title?: string;
  readOnly?: boolean;
  saveOnBlur?: boolean;
  noConfirmation?: boolean;
  /**
   * autocomplete list, pass non-array to skip
   */
  autoCompleteItems?: {
    name: string;
    value: string;
  }[];
  filterByValue?: boolean;
  edit?: boolean;
  idPrefix?: string;
  onBlur?: (v?: unknown) => void;
};

export type FieldHookResults = {
  fieldRef: RefObject<HTMLDivElement | null>;
  getFieldInput: () => HTMLInputElement | null | undefined;
  v: FieldHookParams['value'];
  /**
   * intermediate (not yet final) value before confirmation (if saveOnBlue=false), will always trigger onChange
   * @param v
   * @returns
   */
  setInnerValue: (v: FieldHookParams['value']) => void;
  /**
   * commit/set the value from either data-value or input value
   * @param e
   * @returns
   */
  setValue: (e?: MouseEvent<HTMLElement>) => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /**
   * event handler for clicking on an autocomplete item, depending on saving mode (onBlur or otherwise)
   */
  onAutoCompleteItemClicked: (e: MouseEvent<HTMLElement>) => void;
  isEditing: boolean;
  onKeyUp: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;

  readOnlyProps: {
    onClick?: () => void;
    onFocus?: () => void;
    title?: string;
  };
  filteredAutoCompleteItems?: {
    name: string;
    value: string;
  }[];
  saveOnBlur: boolean;
  noConfirmation: boolean;
};
export type FieldProps = BaseProps &
  FieldHookParams & {
    name: string;
    displayValue?: (v: FieldProps['value']) => FieldProps['value'];
    inputClassName?: string;
    readOnlyClassName?: string;
    iconClassName?: string;
    autoCompletePos?: 'absolute' | 'relative';
    autoCompleteClassName?: string;
  };
