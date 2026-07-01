import { isFunction, isNil } from 'lodash-es';
import type { FocusEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useClickOutside from '@/services/hooks/useClickOutside';

import { FieldHookParams, FieldHookResults } from './typings';

const useField = ({
  value = '',
  set,
  onChange: externalOnChange,
  onBlur: externalOnBlur,
  title,
  readOnly,
  autoCompleteItems,
  saveOnBlur: _saveOnBlur = false,
  noConfirmation: _noConfirmation = false,
  edit = false,
  filterByValue = false
}: FieldHookParams): FieldHookResults => {
  const [isEditing, setIsEditing] = useState(edit);
  const [_value, _setValue] = useState<typeof value>(value);
  // ref for clicking outside
  const fieldRef = useRef<HTMLDivElement>(null);

  const isValid = useCallback(
    (v: FieldHookParams['value'] | undefined): v is FieldHookParams['value'] =>
      Array.isArray(autoCompleteItems)
        ? autoCompleteItems.findIndex((x) => x.value === v) >= 0
        : !isNil(v),
    [autoCompleteItems]
  );

  const {
    setInnerValue,
    onChange,
    onAutoCompleteItemClicked,
    setValue,
    onKeyUp,
    onFocus,
    onBlur,
    disableEditMode,
    enableEditMode,
    getFieldInput,
    saveOnBlur,
    noConfirmation
  } = useMemo(() => {
    const getFieldInput = () => fieldRef.current?.querySelector('input');
    const disableEditMode = () => {
      if (!edit) {
        isEditing && setIsEditing(false);
        getFieldInput()?.blur();
      }
    };
    const enableEditMode = () => {
      !isEditing && setIsEditing(true);
      // when editing, focus on input
      fieldRef?.current?.focus();
      getFieldInput()?.focus();
    };
    const reset = () => _setValue(value);
    const setInnerValue: FieldHookResults['setInnerValue'] = (tmp) => {
      if (_value !== tmp) {
        _setValue(tmp);
        isFunction(externalOnChange) && externalOnChange(tmp);
      }
    };
    const onChange: FieldHookResults['onChange'] = (e) => {
      const tmp = e.currentTarget?.value;
      // console.log('onChange', v);
      setInnerValue(tmp);
    };
    const onAutoCompleteItemClicked: FieldHookResults['onAutoCompleteItemClicked'] = (e) => {
      const tmp = e.currentTarget?.dataset?.value;
      if (isValid(tmp)) {
        setValue(e);
        // if (saveOnBlur) {
        //   // console.log('onAutoCompleteItemClicked', tmp);
        //   setValue(e);
        // } else {
        //   setInnerValue(tmp);
        // }
      } else {
        reset();
      }
    };
    const setValue: FieldHookResults['setValue'] = (e) => {
      const tmp = e?.currentTarget?.dataset?.value ?? getFieldInput()?.value;
      // console.log('setValue', { tmp, _value, valid: isValid(tmp), autoCompleteItems });
      if (isValid(tmp)) {
        const finalValue = isFunction(set) ? set(tmp) ?? tmp : tmp;
        setInnerValue(finalValue);
        disableEditMode();
      } else {
        reset();
      }
    };
    const onKeyUp: FieldHookResults['onKeyUp'] = (e) => {
      // console.log('onKeyUp', getFieldInput()?.value, innerValue);
      if (e.key === 'Enter') {
        setValue();
      } else if (e.key === 'Escape') {
        if (!saveOnBlur) {
          setInnerValue(value);
        }
        disableEditMode();
      } else if (e.currentTarget instanceof HTMLInputElement) {
        setInnerValue(e.currentTarget.value);
      }
    };
    const saveOnBlur = _saveOnBlur;
    const noConfirmation = _noConfirmation || (autoCompleteItems?.length ?? 0) > 0;
    return {
      setInnerValue,
      onChange,
      onAutoCompleteItemClicked,
      setValue,
      onKeyUp,
      onFocus: enableEditMode,
      onBlur: (e: FocusEvent<HTMLElement>) => {
        if (readOnly) {
          return;
        }
        // console.log('onBlur', getFieldInput()?.value, value);
        // workaround for autocompletion + saving on blur - skip saving, see clickOutside logic
        const tmp = e?.currentTarget?.dataset?.value ?? getFieldInput()?.value;
        // console.log('setValue', { tmp, _value, valid: isValid(tmp), autoCompleteItems });
        if (isValid(tmp)) {
          isFunction(externalOnBlur) && externalOnBlur(tmp);
        }
        if (saveOnBlur) {
          if (!Array.isArray(autoCompleteItems)) {
            setValue();
          }
        }
      },
      disableEditMode,
      enableEditMode,
      getFieldInput,
      saveOnBlur,
      noConfirmation
    };
  }, [
    _saveOnBlur,
    autoCompleteItems,
    _noConfirmation,
    edit,
    isEditing,
    value,
    _value,
    externalOnChange,
    isValid,
    set,
    readOnly,
    externalOnBlur
  ]);
  // if clicking outside, set flag to hide unless with autocompletion, then save first
  useClickOutside(fieldRef, () => {
    // console.log('useClickOutside', isEditing);
    if (isEditing) {
      if (saveOnBlur) {
        if (Array.isArray(autoCompleteItems)) {
          setValue();
        }
      } else {
        setInnerValue(value);
      }
      disableEditMode();
    }
  });

  // update state if passed in props change
  useEffect(() => {
    // console.log('useEffect', value, innerValue);
    if (isNil(value) || value !== _value) {
      setInnerValue(value);
      isFunction(externalOnChange) && externalOnChange(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filteredAutoCompleteItems = useMemo(
    () =>
      autoCompleteItems?.filter((x) =>
        filterByValue
          ? x?.value?.toLocaleLowerCase()?.includes(String(_value).toLocaleLowerCase())
          : true
      ),
    [autoCompleteItems, filterByValue, _value]
  );

  const readOnlyProps = isEditing
    ? {}
    : {
        readOnly,
        ...(readOnly
          ? {}
          : {
              onClick: enableEditMode,
              onFocus: enableEditMode,
              title: title ?? 'Click to edit'
            })
      };
  return {
    saveOnBlur,
    noConfirmation,
    fieldRef,
    getFieldInput,
    v: _value,
    isEditing,
    setInnerValue,
    setValue,
    onChange,
    onAutoCompleteItemClicked,
    onKeyUp,
    onBlur,
    onFocus,
    readOnlyProps,
    filteredAutoCompleteItems
  } as const;
};

export default useField;
