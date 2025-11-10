// Import React if you're in a new file
import * as React from "react";
// Make sure TabsTrigger is imported
import { TabsTrigger } from "@/components/ui/tabs";

// Define the props for our new component
interface ResponsiveTabTriggerProps extends React.ComponentProps<typeof TabsTrigger> {
  icon: React.ComponentType<{ className?: string }>; // Expect the component type, e.g., Home
  text: string;
}

/**
 * A wrapper for TabsTrigger that shows an icon and text, 
 * but responsively hides the text on small screens.
 */
export const ResponsiveTabTrigger = ({ icon: Icon, text, ...props }: ResponsiveTabTriggerProps) => {
  return (
    <TabsTrigger {...props}>
      {/* Apply responsive margin to the icon */}
      <Icon className="h-4 w-4 sm:mr-2" />
      {/* Hide the text on mobile (default) and show it on 'sm' screens and up */}
      <span className="hidden sm:inline">{text}</span>
    </TabsTrigger>
  );
};