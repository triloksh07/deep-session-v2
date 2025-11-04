
// Format Time // Output: "01:15:00 AM/PM"
export const formatLocaleTime = (
    time: Date,
    locale = 'en-US',
    options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
    }
): string => time.toLocaleTimeString(locale, options);

// Format Timer Duration // Output: "HH:MM:SS"
export const formatTimerDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Calculate Formated Duration 
// Format as `1hr 15m 45s` for short, `1 hours, 15 minutes, and 45 seconds` for long, and `01:15:45` for timer
export const FormatCalculatedDuration = (
    startTime: number,
    endTime: number,
    format: 'short' | 'long' | 'timer' = 'short'
) => {
    const sessionDuration = endTime - startTime;
    const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
    const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((sessionDuration % (1000 * 60)) / 1000);

    switch (format) {
        case 'short':
            // Handle cases where there are no hours to display
            const parts = [];
            if (hours > 0) parts.push(`${hours}hr`);
            if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
            parts.push(`${seconds}s`);
            return parts.join(' ');
        case 'long':
            return `${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
        case 'timer':
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        default:
            // This satisfies TypeScript's need for an exhaustive switch
            throw new Error('Invalid format! Please use "short", "long", or "timer".');
    }
};

// --- NEW: Helper function to format an ISO date string to human-readable time ---
export const formatISOTime = (isoString: string): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Add a check for invalid dates
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (error) {
        console.error('Error formatting ISO time:', error);
        return 'Invalid Date';
    }
};

// Helper function to format the date headings
export const getDisplayDate = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    console.log('Todays Date is:', today);

    const inputDate = new Date(dateString);

    if (inputDate.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (inputDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return inputDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};