import { useState, useEffect, useCallback } from 'react';

// Helper function to get value from localStorage or use initialValue
function getInitialStoredValue<T>(key: string, initialValueProp: T | (() => T)): T {
  const resolvedInitial = typeof initialValueProp === 'function'
    ? (initialValueProp as () => T)()
    : initialValueProp;

  if (typeof window === 'undefined') {
    return resolvedInitial;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : resolvedInitial;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return resolvedInitial;
  }
}

export function useLocalStorage<T>(key: string, initialValueProp: T | (() => T)): [T, (value: T | ((val: T) => T)) => void] {
  // Memoize the initialValueProp resolution to ensure stability if it's a function passed directly
  const getResolvedInitialValue = useCallback(() => {
    return typeof initialValueProp === 'function'
      ? (initialValueProp as () => T)()
      : initialValueProp;
  }, [initialValueProp]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    // Initialize state directly with a stable resolved initial value, attempting to read from localStorage first.
    // This runs once on component initialization.
    if (typeof window === 'undefined') {
      return getResolvedInitialValue();
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : getResolvedInitialValue();
    } catch (error) {
      console.error(`Error reading localStorage key "${key}" for useState:`, error);
      return getResolvedInitialValue();
    }
  });

  // Effect for client-side hydration and storage event listening
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Client-side hydration check:
    // After the component mounts, re-check localStorage and update state if it differs
    // from the initially rendered state (which might have been SSR or an outdated client state).
    let actualStoredValueInLocalStorage: T;
    const resolvedInitial = getResolvedInitialValue(); // Get stable initial value
    try {
        const item = window.localStorage.getItem(key);
        actualStoredValueInLocalStorage = item ? JSON.parse(item) : resolvedInitial;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}" in useEffect for hydration:`, error);
        actualStoredValueInLocalStorage = resolvedInitial;
    }

    // Only update if the current React state differs from what's actually in localStorage.
    // This avoids an unnecessary re-render if they already match.
    // Using JSON.stringify for comparison is a common approach but has limitations (e.g., key order, undefined values).
    // For this app's data structures, it should generally be acceptable.
    if (JSON.stringify(storedValue) !== JSON.stringify(actualStoredValueInLocalStorage)) {
        setStoredValue(actualStoredValueInLocalStorage);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        let newValueInLocalStorage: T;
        const currentResolvedInitial = getResolvedInitialValue(); // Re-resolve in case initialValueProp changed (though unlikely for stable key)
        try {
            const item = window.localStorage.getItem(key);
            newValueInLocalStorage = item ? JSON.parse(item) : currentResolvedInitial;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}" on storage event:`, error);
            newValueInLocalStorage = currentResolvedInitial;
        }
        setStoredValue(newValueInLocalStorage);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, getResolvedInitialValue, storedValue]); // storedValue is included to re-evaluate hydration if it somehow changes externally to this effect


  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch a storage event so other tabs/windows using the same key can sync.
        window.dispatchEvent(new StorageEvent('storage', { 
          key, 
          oldValue: JSON.stringify(storedValue), // Not perfectly accurate if storedValue was from a function
          newValue: JSON.stringify(valueToStore),
          storageArea: window.localStorage 
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
