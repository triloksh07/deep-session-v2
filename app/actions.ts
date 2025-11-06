"use server";

import { suggestOptimalFocusTimes } from "@/ai/flows/suggest-focus-times";
import type { Session } from "@/types";

export async function getAiSuggestion(sessions: Session[]) {
  if (sessions.length < 3) {
    return {
      suggestedTimes: "Not enough data.",
      reasoning: "Please complete at least 3 focus sessions to get personalized suggestions.",
    };
  }

  const sessionData = sessions
    .map(
      (s) =>
        `Session: ${s.title} (${s.type}), ` +
        `Start: ${s.startTime.toLocaleString()}, ` +
        `End: ${s.endTime.toLocaleString()}, ` +
        `Duration: ${Math.round(s.sessionTime / 60)} mins, ` +
        `Break: ${Math.round(s.breakTime / 60)} mins.`
    )
    .join("\n");

  try {
    const result = await suggestOptimalFocusTimes({ sessionData });
    return result;
  } catch (error) {
    console.error("AI suggestion error:", error);
    return {
      suggestedTimes: "Error",
      reasoning: "Could not generate suggestions at this time. Please try again later.",
    };
  }
}
