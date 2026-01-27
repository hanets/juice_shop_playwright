/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
import { expect, test } from '@playwright/test';
import {
  actualValue,
  arrayKeyComparator,
  AssertionError,
  datetimeStringComparator,
} from '../utils/comparator';

interface CustomArray {
  value: string;
  key: string;
}

interface CustomForTest {
  id: number;
  name: string;
  someArray: CustomArray[];
}

const obj1: CustomForTest = {
  id: 1,
  name: 'Test Object',
  someArray: [
    { value: 'a', key: '1' },
    { value: 'b', key: '2' },
  ],
};

const obj2: CustomForTest = {
  id: 1,
  name: 'Test Object',
  someArray: [
    { value: 'b', key: '2' },
    { value: 'a', key: '1' },
  ],
};

test.describe('Comparator', () => {
  test('should compare two objects with error', () => {
    try {
      actualValue(obj1).toBeEquivalentTo(obj2);
      expect(false, 'Objects should not be equivalent without ignoreArrayOrder').toBe(true); // Force fail if no error is thrown
    } catch (error) {
      if (error instanceof AssertionError) {
        expect(error.message).toContain('Expected objects to be equivalent:');
        expect(error.message).toContain('Value mismatch at someArray[0].value: a !== b');
        expect(error.message).toContain('Value mismatch at someArray[0].key: 1 !== 2');
        expect(error.message).toContain('Value mismatch at someArray[1].value: b !== a');
        expect(error.message).toContain('Value mismatch at someArray[1].key: 2 !== 1');
      } else {
        throw error; // rethrow if it's not the expected type
      }
    }
  });

  test('should compare two objects with array fields ignoring order', () => {
    actualValue(obj1).toBeEquivalentTo(obj2, { ignoreArrayOrder: true });
  });

  test('should compare two objects excluding keys', () => {
    actualValue(obj1).toBeEquivalentTo(obj2, { excludeKeys: ['someArray'] });
  });

  test('should compare two objects excluding keys in nested objects', () => {
    const result = actualValue(obj1).toBeEquivalentToResult(obj2, {
      excludeKeys: ['someArray[].value'],
    });
    expect(result.equal, 'Objects should not be equivalent without ignoreArrayOrder').toBe(false);
    expect(result.diffs).not.toContain('Value mismatch at someArray[0].value: a !== b');
    expect(result.diffs).toContain('Value mismatch at someArray[0].key: 1 !== 2');
  });

  test('should compare two objects with array fields custom comparator', () => {
    actualValue(obj1).toBeEquivalentTo(obj2, {}, [
      'someArray',
      (a, b) => arrayKeyComparator<CustomArray>(a, b, (item) => item.key),
    ]);
  });

  test('should compare two objects errors', () => {
    const obj2: CustomForTest = {
      id: 15,
      name: 'Test Object updated',
      someArray: [
        { value: 'a', key: '1' },
        { value: 'b updated', key: '2' },
      ],
    };
    const result = actualValue(obj1).toBeEquivalentToResult(obj2);
    expect(result.equal).toBe(false);
    expect(result.diffs).toHaveLength(3);
    expect(result.diffs).toContain('Value mismatch at id: 1 !== 15');
    expect(result.diffs).toContain('Value mismatch at name: Test Object !== Test Object updated');
    expect(result.diffs).toContain('Value mismatch at someArray[1].value: b !== b updated');
  });

  interface CustomForTimeTest {
    id: number;
    createdAt: string;
    updatedAt: string;
  }

  const objTime1: CustomForTimeTest = {
    id: 1,
    createdAt: '2024-10-01T12:00:00Z',
    updatedAt: '2024-10-01T12:00:00Z',
  };

  const objTime2: CustomForTimeTest = {
    id: 1,
    createdAt: '2024-10-01T12:00:05Z',
    updatedAt: '2024-10-01T12:00:10Z',
  };

  const objTime3: CustomForTimeTest = {
    id: 1,
    createdAt: '2024-10-01T12:00:05Z',
    updatedAt: '2024-10-01T12:01:10Z',
  };

  test('should compare two objects with time comparator', () => {
    actualValue(objTime1).toBeEquivalentTo(
      objTime2,
      {},
      ['createdAt', datetimeStringComparator],
      ['updatedAt', datetimeStringComparator],
    );
  });

  test('should compare two objects with time comparator - error', () => {
    const result = actualValue(objTime1).toBeEquivalentToResult(
      objTime3,
      {},
      ['createdAt', datetimeStringComparator],
      ['updatedAt', datetimeStringComparator],
    );
    expect(result.equal).toBe(false);
    expect(result.diffs).toHaveLength(1);
    expect(result.diffs).toContain(
      'Value mismatch at updatedAt: 2024-10-01T12:00:00Z !== 2024-10-01T12:01:10Z [datetimeStringComparator]',
    );
  });
});
