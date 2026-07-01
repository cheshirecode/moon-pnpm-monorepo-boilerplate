import type { MouseEvent } from 'react';
import { useCallback, useState } from 'react';

export type DrilldownTrackerHookResults = {
  readonly opened: Record<string, boolean>;
  readonly toggleOpened: (e: MouseEvent<HTMLButtonElement>) => void;
};

const useDrilldownTracker = (): DrilldownTrackerHookResults => {
  const [opened, setOpened] = useState<DrilldownTrackerHookResults['opened']>({});
  const toggleOpened = useCallback<DrilldownTrackerHookResults['toggleOpened']>((e) => {
    const qs = e.currentTarget.dataset.id ?? '';
    setOpened((x) => ({
      ...x,
      [qs]: !(x[qs] ?? false)
    }));
  }, []);

  return { opened, toggleOpened } as const;
};

export default useDrilldownTracker;
