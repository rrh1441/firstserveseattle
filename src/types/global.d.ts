// src/types/global.d.ts

// Extend the global Window interface
interface Window {
    // Declare datafast as an optional function property
    // Use a more specific type for the payload instead of 'any' to satisfy ESLint
    datafast?: (
      action: string,
      payload?: Record<string, string | number | boolean | null | undefined> // Replaced 'any' here
    ) => void;
  }