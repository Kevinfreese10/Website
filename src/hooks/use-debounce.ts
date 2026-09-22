import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value.
 * Commonly used for search inputs and filter triggers.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to delay updating the debounced value (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
