export function mergeByKeys<T extends Record<string, unknown>>(oldValue: T, newValue: T): T {
  const result = { ...oldValue };
  for (const key in newValue) {
    if (Object.prototype.hasOwnProperty.call(newValue, key)) {
      result[key] = newValue[key];
    }
  }
  return result;
}
