import type { RefObject } from 'react';
import { useEffect } from 'react';

const useClickOutside = (ref: RefObject<HTMLElement | null>, cb: () => void) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
        cb();
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cb, ref]);
};

export default useClickOutside;
