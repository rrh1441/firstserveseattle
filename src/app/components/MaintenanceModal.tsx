"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

export default function MaintenanceModal() {
  // Uncomment the line below to show the maintenance modal
  const isMaintenanceMode = true;
  // const isMaintenanceMode = false;

  if (!isMaintenanceMode) return null;

  return (
    <Dialog open={isMaintenanceMode}>
      <DialogContent className="sm:max-w-md border-orange-200 bg-orange-50">
        <DialogHeader>
          <DialogTitle className="text-orange-800">
            🔧 Scheduled Maintenance
          </DialogTitle>
          <DialogDescription className="text-orange-700">
            We apologize for the inconvenience. Our website is currently undergoing scheduled maintenance on June 30, 2025. 
            Please check back tomorrow as we work to improve your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center pt-4">
          <p className="text-sm text-orange-700">
            Thank you for your understanding!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}