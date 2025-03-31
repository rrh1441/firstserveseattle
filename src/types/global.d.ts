// src/types/global.d.ts

// Extend the global Window interface
interface Window {
    // Declare datafast as an optional function property
    // Adjust the function signature if Datafast expects different parameters or return types
    datafast?: (action: string, payload?: Record<string, any>) => void;
  }