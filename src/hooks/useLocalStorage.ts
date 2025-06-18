import { useState, useEffect, useCallback } from 'react';

// Helper to safely parse JSON
function parseJSON<T>(value: string | null): T | undefined {
  try {
    if (value === null || value === undefined) return undefined;
    return JSON.parse(value);
  } catch (error) {
    // console.warn('Parsing error on', { value }, error);
    return undefined;
  }
}

export function useLocalStorage<T>(key: string, initialValueProp: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
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

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        // console.warn(`Attempted to set localStorage key “${key}” on the server.`);
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
        return;
      }
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        window.dispatchEvent(new CustomEvent('local-storage-changed', { detail: { key } }));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  // Effect for cross-tab/window synchronization and same-tab custom event
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: Event) => {
      let eventKey: string | null = null;
      let eventNewValue: string | null = null;

      if (event instanceof StorageEvent) {
        eventKey = event.key;
        eventNewValue = event.newValue;
      } else if (event instanceof CustomEvent && event.type === 'local-storage-changed' && event.detail) {
        eventKey = event.detail.key;
        eventNewValue = window.localStorage.getItem(key);
      }

      if (eventKey === key) {
        try {
          if (eventNewValue === null) {
            setStoredValue(getInitialValue());
          } else {
            const parsedItem = parseJSON<T>(eventNewValue);
            // Only update if the parsed value is different from the current stored value
            // to avoid unnecessary re-renders if the event was for the exact same value.
            if (JSON.stringify(storedValue) !== JSON.stringify(parsedItem)) {
                 setStoredValue(parsedItem !== undefined ? parsedItem : getInitialValue());
            }
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
  // getInitialValue depends on initialValueProp. storedValue is added to dependencies
  // to ensure re-evaluation for the comparison inside handleStorageChange.
  }, [key, getInitialValue, storedValue]);

  return [storedValue, setValue];
}
