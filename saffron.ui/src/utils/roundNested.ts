/* eslint-disable @typescript-eslint/no-explicit-any */
export function roundNested(obj: any): any {
  if (typeof obj === "number") {
    return Math.round(obj * 100) / 100;
  } else if (Array.isArray(obj)) {
    return obj.map(roundNested);
  } else if (typeof obj === "object" && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = roundNested(obj[key]);
    }
    return result;
  }
  return obj;
}