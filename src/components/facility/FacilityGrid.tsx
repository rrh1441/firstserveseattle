// components/facility/FacilityGrid.tsx
import React from 'react';

// Import the function to fetch court data
// Adjust the path if your lib directory is structured differently
import { getTennisCourts, TennisCourt } from '@/lib/getTennisCourts';

// Import the card component to render each facility
import FacilityCard from './FacilityCard';

// Define props if the component accepts any (optional for now)
// interface FacilityGridProps {}

// Make the component async to fetch data on the server
export default async function FacilityGrid(/* props: FacilityGridProps */) {
  // Fetch the tennis court data
  const courts: TennisCourt[] = await getTennisCourts();

  console.log(`Rendering FacilityGrid component with ${courts.length} courts.`);

  if (!courts || courts.length === 0) {
    return <p>No facilities found.</p>; // Handle case where no data is returned
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Map over the fetched courts and render a card for each */}
      {courts.map((court) => (
        <FacilityCard key={court.id} court={court} />
      ))}
    </div>
  );
}
