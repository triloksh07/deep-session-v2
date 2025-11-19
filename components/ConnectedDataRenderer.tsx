'use client';
import { Loader2 } from "lucide-react";

// --- Generic Helper for Loading/Error ---
const ConnectedDataRenderer = ({
    isLoading,
    isError,
    error, 
    children,
}: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null; 
    children: React.ReactNode;
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // --- 6. RENDER THE ACTUAL ERROR ---
    if (isError) {
        // Also log it to the console for good measure
        if (error) console.error("TanStack Query Error:", error);

        return (
            <div className="text-center py-10 text-destructive">
                <p>Error loading data. Please try again.</p>
                {/* This will show us the error message! */}
                {error && (
                    <p className="text-xs mt-2 font-mono">
                        <strong>Debug Info:</strong> {error.message}
                    </p>
                )}
            </div>
        );
    }

    return <>{children}</>;
};

export default ConnectedDataRenderer;