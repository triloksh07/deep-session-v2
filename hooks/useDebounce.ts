// import { useEffect, useState, useRef } from 'react';

// function useDebounce<T>(value: T, delay: number): T{
//     const [debouncedValue, setDebouncedValue] = useState(value);

//     useEffect(() => {
//         const handler = setTimeout(() => {
//            setDebouncedValue(value);
//         }, delay); // debounce delay in ms

//         return () => clearTimeout(handler); // cleanup on each keystroke
//     }, [value, delay]);

//     return debouncedValue;
// };

// export default useDebounce;

import { useEffect, useState, useRef } from 'react';

/**
 * A hook to debounce a value.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns A tuple containing [debouncedValue, cancelDebounce]
 */
function useDebounce<T>(value: T, delay: number): [T, () => void] {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const cancelDebounce = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        timerRef.current = setTimeout(() => {
           setDebouncedValue(value);
        }, delay); // debounce delay in ms

        // cleanup on each keystroke or unmount
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);

    // Return both the value and the cancel function
    return [debouncedValue, cancelDebounce];
};

export default useDebounce;