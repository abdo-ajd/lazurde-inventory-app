import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValueProp: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
  // Memoize the initialValueProp resolution to ensure stability
  const getResolvedInitialValue = useCallback(() => {
    return typeof initialValueProp === 'function'
      ? (initialValueProp as () => T)()
      : initialValueProp;
  }, [initialValueProp]);

  // Initialize state:
  // - If on server, use resolved initial value.
  // - If on client, try reading from localStorage, fallback to resolved initial value.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return getResolvedInitialValue();
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : getResolvedInitialValue();
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}" during initial useState:`, error);
      return getResolvedInitialValue();
    }
  });

  // Effect for client-side hydration:
  // Ensures the state is synced with localStorage after initial mount if they differ.
  // This runs once after mount, or if key/initialValueProp changes.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const resolvedInitial = getResolvedInitialValue();
    let valueFromStorage: T;
    try {
      const item = window.localStorage.getItem(key);
      valueFromStorage = item ? JSON.parse(item) : resolvedInitial;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}" in hydration useEffect:`, error);
      valueFromStorage = resolvedInitial;
    }

    // Sync if the current state (storedValue) differs from what's actually in localStorage.
    // This handles cases where useState might have used a fallback initially.
    if (JSON.stringify(storedValue) !== JSON.stringify(valueFromStorage)) {
      setStoredValue(valueFromStorage);
    }
    // Deliberately not including storedValue in deps to prevent loop from this effect's setStoredValue.
    // This effect is for one-time hydration sync based on key and initial value logic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, getResolvedInitialValue]);

  // Effect for listening to storage changes from other tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        if (event.newValue === null) { // Item was removed or localStorage.clear() was called
          setStoredValue(getResolvedInitialValue());
        } else {
          try {
            setStoredValue(JSON.parse(event.newValue));
          } catch (error) {
            console.warn(`Error parsing localStorage key "${key}" on storage event:`, error);
            // Fallback to initial value if parsing new value fails
            setStoredValue(getResolvedInitialValue());
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, getResolvedInitialValue]); // getResolvedInitialValue is needed here for the fallback logic

  // Function to update the value in state and localStorage.
  // Memoized with useCallback to stabilize its reference.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function like useState's setter
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Note: Manually dispatching a storage event for same-tab updates isn't
        // standard and usually not needed as React state updates will trigger re-renders.
        // The 'storage' event is primarily for inter-tab communication.
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]); // storedValue is a dependency for the functional update case of `value`

  return [storedValue, setValue];
}
