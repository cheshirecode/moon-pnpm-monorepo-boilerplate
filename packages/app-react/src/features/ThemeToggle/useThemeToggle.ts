import { useEffect, useState } from 'react';

import type { ThemeToggleProps } from './typings';
import { addTheme, applyTheme, getTheme, removeTheme } from './utils';

const useThemeToggle = ({ isApply = true, onChange }: ThemeToggleProps) => {
  const [isDarkMode, setIsDarkMode] = useState(getTheme() === 'dark');
  const onClick = () => {
    setIsDarkMode((v) => !v);
  };

  useEffect(() => {
    isApply && applyTheme();
  }, [isApply]);

  useEffect(() => {
    if (isDarkMode) {
      addTheme('dark');
    } else {
      removeTheme('dark');
    }
    if (onChange) {
      onChange(getTheme());
    }
  }, [isDarkMode, onChange]);

  return {
    isDarkMode,
    onClick
  } as const;
};

export default useThemeToggle;
