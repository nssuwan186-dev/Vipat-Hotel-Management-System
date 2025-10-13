import React, { useState, useEffect } from 'react';

/**
 * A custom React hook that mimics useState but persists the state to localStorage.
 * @param key The key to use in localStorage.
 * @param initialValue The initial value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue) {
                // Use a reviver function to handle date strings
                return JSON.parse(storedValue, (k, v) => {
                    // This regex checks for the specific ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
                    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) {
                            return d;
                        }
                    }
                    return v;
                });
            }
            return initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;
