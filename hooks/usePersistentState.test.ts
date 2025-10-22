import { renderHook, act } from '@testing-library/react';
import usePersistentState from './usePersistentState';

describe('usePersistentState', () => {
  const KEY = 'test-key';

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with the initial value if localStorage is empty', () => {
    const { result } = renderHook(() => usePersistentState(KEY, 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with the value from localStorage if it exists', () => {
    window.localStorage.setItem(KEY, JSON.stringify('stored'));
    const { result } = renderHook(() => usePersistentState(KEY, 'initial'));
    expect(result.current[0]).toBe('stored');
  });

  it('should update the state and persist it to localStorage', () => {
    const { result } = renderHook(() => usePersistentState(KEY, 'initial'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify('new-value'));
  });

  it('should handle complex objects and dates', () => {
    const date = new Date();
    const initialValue = { a: 1, b: date };
    window.localStorage.setItem(KEY, JSON.stringify(initialValue));

    const { result } = renderHook(() => usePersistentState(KEY, { a: 0, b: new Date(0) }));

    expect(result.current[0]).toEqual(initialValue);
  });
});
