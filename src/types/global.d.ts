// src/types/global.d.ts

// Define possible payload structures
type DatafastSimplePayload = Record<string, string | number | boolean | null | undefined>;

type DatafastEventPayload = {
  name: string;
  properties?: DatafastSimplePayload; // Allow nested properties object
};

// Extend the global Window interface
interface Window {
  datafast?: (
    action: string,
    // Use a union type to allow different valid payload structures
    payload?: DatafastSimplePayload | DatafastEventPayload
  ) => void;
}

// Make sure this file is included in your tsconfig.json "include" array:
// "include": [ ..., "src/types/global.d.ts" ]