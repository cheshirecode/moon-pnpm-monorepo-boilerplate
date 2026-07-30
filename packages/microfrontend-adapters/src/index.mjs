export function createMount(renderFn, cleanupFn) {
  return (container) => {
    const result = renderFn(container);
    return () => {
      if (typeof cleanupFn === 'function') cleanupFn(result);
    };
  };
}