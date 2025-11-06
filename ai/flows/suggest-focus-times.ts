'use server';

/**
 * @fileOverview A flow to analyze user session data and suggest optimal times for focused work.
 *
 * - suggestOptimalFocusTimes - A function that handles the suggestion of optimal focus times.
 * - SuggestOptimalFocusTimesInput - The input type for the suggestOptimalFocusTimes function.
 * - SuggestOptimalFocusTimesOutput - The return type for the suggestOptimalFocusTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalFocusTimesInputSchema = z.object({
  sessionData: z
    .string()
    .describe(
      'A string containing user session data, including session type, title, notes, start time, end time, and break times.'
    ),
});
export type SuggestOptimalFocusTimesInput = z.infer<typeof SuggestOptimalFocusTimesInputSchema>;

const SuggestOptimalFocusTimesOutputSchema = z.object({
  suggestedTimes: z
    .string()
    .describe(
      'A string containing suggested optimal times for focused work, based on the analyzed session data.'
    ),
  reasoning: z
    .string()
    .describe(
      'A string explaining the reasoning behind the suggested optimal focus times.'
    ),
});
export type SuggestOptimalFocusTimesOutput = z.infer<typeof SuggestOptimalFocusTimesOutputSchema>;

export async function suggestOptimalFocusTimes(
  input: SuggestOptimalFocusTimesInput
): Promise<SuggestOptimalFocusTimesOutput> {
  return suggestOptimalFocusTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalFocusTimesPrompt',
  input: {schema: SuggestOptimalFocusTimesInputSchema},
  output: {schema: SuggestOptimalFocusTimesOutputSchema},
  prompt: `You are an AI assistant designed to analyze user session data and suggest optimal times for focused work.

  Analyze the following session data to identify patterns and suggest the best times for the user to focus:

  Session Data: {{{sessionData}}}

  Based on this data, suggest optimal times for the user to focus and explain your reasoning. Consider factors such as session duration, break times, session types, and any notes provided by the user.
  Ensure that the suggestedTimes output is in a user-friendly format, such as a list of time ranges (e.g., "9:00 AM - 12:00 PM, 2:00 PM - 5:00 PM").
  `,
});

const suggestOptimalFocusTimesFlow = ai.defineFlow(
  {
    name: 'suggestOptimalFocusTimesFlow',
    inputSchema: SuggestOptimalFocusTimesInputSchema,
    outputSchema: SuggestOptimalFocusTimesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
