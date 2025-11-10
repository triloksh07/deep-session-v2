// ----------------- app/store/sessionUtils.ts -----------------

// --- Type Definitions for Clarity and Safety ---

// Describes the shape of a single break object from the store.
interface Break {
  start: Date | string;
  end: Date | string | null;
}

// Defines the expected input for the main function.
interface CreateSessionObjectParams {
  details: {
    sessionTypeId: string | null;
    title: string;
    notes: string;
  };
  startTime: Date;
  sessionTimeMs: number;
  breakTimeMs: number;
  breaks: Break[];
}

// [MODIFIED] Defines the structure of the object returned by the function.
// Removed sessionPayload.id and breaksPayload.id/session_id
interface FinalSessionObject {
  sessionPayload: {
    session_type_id: string | null;
    title: string;
    notes: string;
    started_at: string;
    ended_at: string;
    total_focus_ms: number;
    total_break_ms: number;
  };
  breaksPayload: {
    break_started_at: string;
    break_ended_at: string | null;
  }[];
}

/**
 * Prepares the session and break data into a structured format for the database.
 * This function validates inputs and ensures data integrity before returning.
 *
 * @param {CreateSessionObjectParams} params - The destructured object containing all session details.
 * @returns {FinalSessionObject} An object containing the formatted session and break payloads.
 * @throws {Error} Throws an error if the input data is invalid.
 */

export const createFinalSessionObject = ({ details, startTime, sessionTimeMs, breakTimeMs, breaks }: CreateSessionObjectParams): FinalSessionObject => {
  // --- 1. Input Validation for Robustness ---
  if (!details || typeof details !== 'object') {
    throw new Error("Invalid 'details' object provided.");
  }
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    throw new Error("Invalid 'startTime' provided. Must be a valid Date object.");
  }
  if (typeof sessionTimeMs !== 'number' || sessionTimeMs < 0) {
    throw new Error("'sessionTimeMs' must be a non-negative number.");
  }
  if (typeof breakTimeMs !== 'number' || breakTimeMs < 0) {
    throw new Error("'breakTimeMs' must be a non-negative number.");
  }
  if (!Array.isArray(breaks)) {
    throw new Error("'breaks' must be an array.");
  }
  // --- 2. Data Preparation ---

  const endTime = new Date();
  // [REMOVED] const sessionId = crypto.randomUUID();

  // --- 2. Create the main session payload with data sanitization ---
  // [MODIFIED] Removed `id: sessionId`
  const sessionPayload = {
    session_type_id: details.sessionTypeId,
    title: details.title.trim(), // The main "what are you doing" info
    notes: details.notes.trim(), // The extra notes
    started_at: startTime.toISOString(),
    ended_at: endTime.toISOString(),
    total_focus_ms: Math.round(sessionTimeMs),// Ensure values are integers
    total_break_ms: Math.round(breakTimeMs),
  };

  // --- 3. Create the breaks payload with safe date handling ---
  // [MODIFIED] Removed `id` and `session_id` from break items
  const breaksPayload = breaks
    .map(breakItem => {
      try {
        const startDate = new Date(breakItem.start);
        // Ensure the start date is valid before proceeding
        if (isNaN(startDate.getTime())) {
          throw new Error(`Invalid start date for break: ${breakItem.start}`);
        }

        let endDateISO: string | null = null;
        if (breakItem.end) {
          const endDate = new Date(breakItem.end);
          // Ensure the end date is valid before converting
          if (isNaN(endDate.getTime())) {
            throw new Error(`Invalid end date for break: ${breakItem.end}`);
          }
          endDateISO = endDate.toISOString();
        }

        return {
          break_started_at: startDate.toISOString(),
          break_ended_at: endDateISO,
        };
      } catch (error) {
        console.error("Skipping invalid break item due to processing error:", breakItem, error);
        return null; // Return null for any break item that fails validation
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null); // Filter out invalid items

  return {
    sessionPayload,
    breaksPayload
  };
};