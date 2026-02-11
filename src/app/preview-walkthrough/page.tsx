"use client";

import WalkthroughModal from "@/app/components/WalkthroughModal";

export default function PreviewWalkthrough() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Preview page - modal should appear below</p>
      <WalkthroughModal
        isOpen={true}
        onClose={() => alert("onClose called")}
        onSetupNotifications={() => alert("onSetupNotifications called")}
      />
    </div>
  );
}
