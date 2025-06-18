import { useState, useEffect, useCallback } from 'react';

// Helper to safely parse JSON
function parseJSON<T>(value: string | null): T | undefined {
  try {
    if (value === null || value === undefined) return undefined; // Handle explicit null or undefined input
    return JSON.parse(value);
  } catch (error) {
    // console.warn('Parsing error on', { value }, error);
    return undefined;
  }
}

export function useLocalStorage<T>(key: string, initialValueProp: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
  // Memoize the function to get the initial value.
  // This ensures it's stable unless initialValueProp itself changes.
  const getInitialValue = useCallback(() => {
    return typeof initialValueProp === 'function'
      ? (initialValueProp as () => T)()
      : initialValueProp;
  }, [initialValueProp]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return getInitialValue();
    }
    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? parseJSON<T>(item) : undefined;
      return parsedItem !== undefined ? parsedItem : getInitialValue();
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}” during initial useState:`, error);
      return getInitialValue();
    }
  });

  // Effect to update state if 'key' or 'initialValueProp' (via getInitialValue) changes.
  // This handles scenarios like dynamic keys or if the initial value logic itself changes.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        const parsedItem = item ? parseJSON<T>(item) : undefined;
        const currentValueToSet = parsedItem !== undefined ? parsedItem : getInitialValue();
        // Only update if the value actually differs to prevent unnecessary re-renders.
        // This check is crucial for preventing loops if getInitialValue changes but results in the same logical value.
        if (JSON.stringify(storedValue) !== JSON.stringify(currentValueToSet)) {
            setStoredValue(currentValueToSet);
        }
      } catch (error) {
        console.warn(`Error reading localStorage for key “${key}” on key/initialValue change:`, error);
        // Fallback to initial value if error occurs
        if (JSON.stringify(storedValue) !== JSON.stringify(getInitialValue())) {
            setStoredValue(getInitialValue());
        }
      }
    } else {
      // For SSR, if key or initialValueProp changes, update to new initial value
      const newInitial = getInitialValue();
      if (JSON.stringify(storedValue) !== JSON.stringify(newInitial)) {
        setStoredValue(newInitial);
      }
    }
  // IMPORTANT: Only include key and getInitialValue. storedValue should not be here to avoid loops from this effect itself.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, getInitialValue]);


  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        // console.warn(`Attempted to set localStorage key “${key}” on the server.`);
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue); // Update state for SSR optimistic updates if needed
        return;
      }
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        // Dispatch a custom event for same-tab listeners.
        window.dispatchEvent(new CustomEvent('local-storage-changed', { detail: { key } }));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // storedValue is a dependency for the functional update `value(prev => ...)`
  );

  // Effect for cross-tab/window synchronization and same-tab custom event
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: Event) => {
      let eventKey: string | null = null;
      let eventNewValue: string | null = null;

      if (event instanceof StorageEvent) { // Standard 'storage' event from other tabs
        eventKey = event.key;
        eventNewValue = event.newValue;
      } else if (event instanceof CustomEvent && event.type === 'local-storage-changed' && event.detail) { // Custom event from same tab
        eventKey = event.detail.key;
        // For custom event, we need to re-read from localStorage as detail might not carry the value
        eventNewValue = window.localStorage.getItem(key);
      }

      if (eventKey === key) {
        try {
          if (eventNewValue === null) { // Item was removed or cleared
            setStoredValue(getInitialValue());
          } else {
            const parsedItem = parseJSON<T>(eventNewValue);
            setStoredValue(parsedItem !== undefined ? parsedItem : getInitialValue());
          }
        } catch (error) {
          console.warn(`Error reading localStorage key “${key}” on storage event:`, error);
          setStoredValue(getInitialValue());
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-changed', handleStorageChange);
    };
  }, [key, getInitialValue]); // getInitialValue depends on initialValueProp.

  return [storedValue, setValue];
}
