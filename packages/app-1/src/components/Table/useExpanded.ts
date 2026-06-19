import { useCallback, useState } from 'react';

const useExpanded = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const onExpandedChange = useCallback(
    (fn: (expanded: Record<string, boolean>) => Record<string, boolean>) => {
      const newExpanded = fn(expanded);
      setExpanded(newExpanded);
    },
    [expanded]
  );

  return [expanded, setExpanded, onExpandedChange] as const;
};

export default useExpanded;
