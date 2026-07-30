export function timeout(ms, { rejectWith } = {}) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      if (rejectWith !== undefined) {
        reject(typeof rejectWith === 'function' ? rejectWith() : rejectWith);
      } else {
        resolve();
      }
    }, ms);
    if (typeof id === 'object' && typeof id.unref === 'function') id.unref();
  });
}

export function delay(ms, value) {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(value), ms);
    if (typeof id === 'object' && typeof id.unref === 'function') id.unref();
  });
}

export function retry(fn, { tries = 3, baseDelay = 200, maxDelay = 5000, onRetry } = {}) {
  let attempt = 0;
  const execute = async () => {
    attempt++;
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= tries) throw err;
      if (onRetry) onRetry(err, attempt);
      const backoff = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await delay(backoff);
      return execute();
    }
  };
  return execute();
}

export function debounce(fn, wait = 300) {
  let timer = null;
  const debounced = function (...args) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  debounced.flush = function (...args) {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
      fn.apply(this, args);
    }
  };
  return debounced;
}

export function throttle(fn, wait = 300) {
  let lastTime = 0;
  let timer = null;
  let lastArgs = null;
  let lastContext = null;

  const throttled = function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    lastArgs = args;
    lastContext = this;

    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        lastTime = Date.now();
        fn.apply(lastContext, lastArgs);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastContext = null;
  };

  return throttled;
}