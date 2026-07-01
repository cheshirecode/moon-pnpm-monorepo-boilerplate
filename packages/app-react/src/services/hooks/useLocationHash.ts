import { useSyncExternalStore } from 'react';

export default function useLocationHash() {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  return hash;
}

const getSnapshot = () => window?.location?.hash;

const subscribe = (callback: () => void) => {
  window?.addEventListener('hashchange', callback);
  return () => {
    window.removeEventListener('hashchange', callback);
  };
};
