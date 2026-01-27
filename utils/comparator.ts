import { parse } from 'date-fns';

class Comparator<T> {
  constructor(private actual: T) {}

  toBeEquivalentTo(expected: T, options?: CompareOptions, ...customComparers: FieldComparator[]) {
    const result = deepEqual(this.actual, expected, options, '', ...customComparers);

    if (!result.equal) {
      const diffText = result.diffs.join('\n');
      throw new AssertionError(`Expected objects to be equivalent:\n${diffText}`);
    }
  }

  toBeEquivalentToResult(
    expected: T,
    options?: CompareOptions,
    ...customComparers: FieldComparator[]
  ) {
    return deepEqual(this.actual, expected, options, '', ...customComparers);
  }
}

export function actualValue<T>(actual: T): Comparator<T> {
  return new Comparator(actual);
}

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

type FieldComparator = [string, <Z>(a: Z, b: Z) => boolean];

type CompareOptions = {
  excludeKeys?: string[];
  ignoreArrayOrder?: boolean;
};

type CompareResult = {
  equal: boolean;
  diffs: string[];
};

function deepEqual<T>(
  actual: T,
  expected: T,
  options?: CompareOptions,
  path = '',
  ...customComparers: FieldComparator[]
): CompareResult {
  const diffs: string[] = [];

  // If values are strictly equal, no diffs
  if (actual === expected) return { equal: true, diffs };

  // If this path is excluded, skip comparison
  if (options?.excludeKeys?.includes(path.replaceAll(/\[\d+\]/g, '[]'))) {
    return { equal: true, diffs };
  }

  // Check for custom comparers
  const customComparer = customComparers.find(([pathPattern]) => pathPattern === path);
  if (customComparer) {
    const [, compareFn] = customComparer;
    const isEqual = compareFn(actual as unknown, expected as unknown);
    if (!isEqual) {
      // diffs.push(`Custom comparison failed at ${path}`);
      diffs.push(`Value mismatch at ${path}: ${actual} !== ${expected} [${compareFn.name}]`);
      return { equal: false, diffs };
    }
    return { equal: true, diffs };
  }

  // Arrays need special handling before generic type checks
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      diffs.push(`Array length mismatch at ${path}: ${actual.length} !== ${expected.length}`);
      return { equal: false, diffs };
    }

    if (options?.ignoreArrayOrder) {
      const sortedActual = [...actual].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      );
      const sortedExpected = [...expected].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
      );

      for (let i = 0; i < sortedActual.length; i++) {
        const child = deepEqual(
          sortedActual[i],
          sortedExpected[i],
          options,
          `${path}[${i}]`,
          ...customComparers,
        );
        if (!child.equal) diffs.push(...child.diffs);
      }
    } else {
      for (let i = 0; i < actual.length; i++) {
        const child = deepEqual(
          actual[i],
          expected[i],
          options,
          `${path}[${i}]`,
          ...customComparers,
        );
        if (!child.equal) diffs.push(...child.diffs);
      }
    }
    return { equal: diffs.length === 0, diffs };
  }

  // Type mismatch
  if (typeof actual !== typeof expected) {
    diffs.push(`Type mismatch at ${path}`);
    return { equal: false, diffs };
  }

  // Primitive or null mismatch
  if (
    typeof actual !== 'object' ||
    typeof expected !== 'object' ||
    actual === null ||
    expected === null
  ) {
    diffs.push(`Value mismatch at ${path}: ${actual} !== ${expected}`);
    return { equal: false, diffs };
  }

  // Deep compare objects (expected keys only)
  const actualObj = actual as Record<string, unknown>;
  const expectedObj = expected as Record<string, unknown>;

  const keysToCompare = Object.keys(expectedObj);
  const pathPrefix = path ? `${path}.` : '';
  for (const key of keysToCompare) {
    const child = deepEqual(
      actualObj[key],
      expectedObj[key],
      options,
      `${pathPrefix}${key}`,
      ...customComparers,
    );
    if (!child.equal) diffs.push(...child.diffs);
  }

  return { equal: diffs.length === 0, diffs };
}

export function arrayKeyComparator<Z>(
  a: unknown,
  b: unknown,
  keyFunction: (item: Z) => string,
): boolean {
  const aTyped = a as Z[];
  const bTyped = b as Z[];
  if (aTyped.length !== bTyped.length) return false;
  const sortByKey = (arr: Z[]) =>
    arr.slice().sort((x, y) => keyFunction(x).localeCompare(keyFunction(y)));
  const sortedA = sortByKey(aTyped);
  const sortedB = sortByKey(bTyped);
  for (let i = 0; i < sortedA.length; i++) {
    actualValue(sortedA[i]).toBeEquivalentTo(sortedB[i]);
  }
  return true;
}

export function datetimeStringComparator(
  a: unknown,
  b: unknown,
  options?: { pattern?: string; secondsDifference?: number },
): boolean {
  const pattern = options?.pattern || "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
  //use pattern to parse date strings
  const parseInput = (value: unknown): Date => {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = parse(value, pattern, new Date(0));
      if (!isNaN(parsed.getTime())) return parsed;
      const fallback = new Date(value);
      return fallback;
    }
    return new Date(NaN);
  };
  const aDate = parseInput(a);
  const bDate = parseInput(b);
  const secondsDifference = options?.secondsDifference || 60;
  const diffInSeconds = Math.abs((aDate.getTime() - bDate.getTime()) / 1000);
  return diffInSeconds <= secondsDifference;
}
