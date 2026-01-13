"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

export default function MaintenanceModal() {
  // Set to false when maintenance is complete
  const isMaintenanceMode = true;

  if (!isMaintenanceMode) return null;

  return (
    <Dialog open={isMaintenanceMode}>
      <DialogContent className="sm:max-w-md border-orange-200 bg-orange-50">
        <DialogHeader>
          <DialogTitle className="text-orange-800">
            🔧 Temporarily Down
          </DialogTitle>
          <DialogDescription className="text-orange-700">
            We&apos;re upgrading our database and will be back up shortly. Thanks for your patience!
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}