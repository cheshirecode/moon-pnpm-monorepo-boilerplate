export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) return new Map(Array.from(value, ([k, v]) => [k, deepClone(v)]));
  if (value instanceof Set) return new Set(Array.from(value, (v) => deepClone(v)));
  if (Array.isArray(value)) return value.map(deepClone);
  const cloned = Object.create(Object.getPrototypeOf(value));
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor) Object.defineProperty(cloned, key, descriptor);
  }
  for (const key of Object.keys(value)) {
    cloned[key] = deepClone(value[key]);
  }
  return cloned;
}

export function deepMerge(target, ...sources) {
  const output = deepClone(target);
  for (const source of sources) {
    if (source === undefined || source === null) continue;
    if (!isObject(source)) continue;

    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        output[key] = deepMerge(output[key] ?? {}, source[key]);
      } else if (Array.isArray(source[key])) {
        output[key] = deepClone(source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}

export function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.toString() === b.toString();
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export function pick(object, keys) {
  const result = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
  }
  return result;
}

export function omit(object, keys) {
  const keySet = new Set(keys);
  const result = {};
  for (const key of Object.keys(object)) {
    if (!keySet.has(key)) {
      result[key] = object[key];
    }
  }
  return result;
}