// components/facility/FacilityCard.tsx
import React from 'react';
import Link from 'next/link';

// Import the type definition for a court
import { TennisCourt } from '@/lib/getTennisCourts'; // Adjust path if needed

// Import UI components if you're using a library like shadcn/ui
// Example: import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"; // Adjust path

// Define the props for the component
interface FacilityCardProps {
  court: TennisCourt;
}

// Export the component as default
export default function FacilityCard({ court }: FacilityCardProps) {
  // Basic card structure - Replace with <Card> components if using shadcn/ui
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      {/* Card Header (Example) */}
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold text-lg">{court.title || 'Unnamed Facility'}</h3>
      </div>

      {/* Card Content (Example) */}
      <div className="p-4 flex-grow">
        <p className="text-sm text-gray-600">
          {court.address || 'Address not available'}
        </p>
        {/* Add more details here as needed - e.g., amenities, link to map */}
      </div>

      {/* Card Footer (Example with Link) */}
      {/* Ensure you have a unique identifier like a slug or use the ID for the link */}
      {/* If you don't have a slug yet, you might need to generate one or use the ID */}
      <div className="p-4 bg-gray-50 border-t mt-auto">
        <Link
          // Assuming you want to link to the dynamic route we set up
          // You might need to create a 'slug' field for your courts or use the ID
          href={`/courts/${court.id}`} // Example using ID, adjust if you have slugs
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Details & Availability
        </Link>
      </div>
    </div>
  );
}

