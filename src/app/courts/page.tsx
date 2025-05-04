// src/app/courts/page.tsx
import React from 'react';

// Import the FacilityGrid component using the RELATIVE path
// This bypasses the tsconfig alias for diagnostics.
import FacilityGrid from '../../components/facility/FacilityGrid';

// This page component can remain async if FacilityGrid fetches data internally
// or if you plan to add other async operations later. Otherwise, it can be sync.
export default async function CourtsPage() {

  console.log("Rendering the main /courts listing page using FacilityGrid.");

  return (
    <div className="container mx-auto p-4">
      {/* You might want a heading specific to the facility grid */}
      <h1 className="text-2xl font-bold mb-4">Tennis Facilities</h1>

      {/* Render the FacilityGrid component */}
      {/* Pass any necessary props to FacilityGrid if required */}
      <FacilityGrid />

    </div>
  );
}
