"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { getAiSuggestion } from "@/app/actions";
import type { Session } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiSuggestionProps {
  sessions: Session[];
}

export function AiSuggestion({ sessions }: AiSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ suggestedTimes: string; reasoning: string } | null>(null);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await getAiSuggestion(sessions);
      if (result.suggestedTimes === 'Error') {
        setError(result.reasoning);
      } else {
        setSuggestion(result);
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
        <CardDescription>Get AI-powered suggestions for your peak focus times.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestion ? (
          <Alert className="border-accent bg-accent/10">
            <Sparkles className="h-4 w-4 text-accent-foreground!" />
            <AlertTitle className="text-accent-foreground font-bold">Optimal Focus Times</AlertTitle>
            <AlertDescription className="text-accent-foreground/80">
              <p className="font-semibold">{suggestion.suggestedTimes}</p>
              <p className="mt-2 text-xs">{suggestion.reasoning}</p>
            </AlertDescription>
          </Alert>
        ) : error ? (
           <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        
        <Button onClick={handleGetSuggestion} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {suggestion ? "Regenerate" : "Get Suggestion"}
        </Button>
      </CardContent>
    </Card>
  );
}
