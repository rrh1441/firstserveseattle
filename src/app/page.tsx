/* src/app/page.tsx */
"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Paywall from "./tennis-courts/components/paywall"; // Ensure path is correct
import { updateUserSession } from "@/lib/updateUserSessions";
import TennisCourtList from "./tennis-courts/components/TennisCourtList"; // Ensure path is correct
import ViewsCounter from "./tennis-courts/components/counter"; // Import the counter

export default function HomePage() {
  const pathname = usePathname();
  const [showPaywall, setShowPaywall] = useState(false);
  const [viewsCount, setViewsCount] = useState<number>(0); // State for views count
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial check

  const exemptPaths = ["/reset-password", "/login", "/signup", "/members", "/privacy-policy", "/terms-of-service"]; // Added policy/terms

  useEffect(() => {
    if (exemptPaths.includes(pathname)) {
       setIsLoading(false); // Don't show loading on exempt pages
       return;
    }

    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("userId", storedId);
    }
    setUserId(storedId);
  }, [pathname]); // Removed exemptPaths from dependency array

  useEffect(() => {
    if (!userId || exemptPaths.includes(pathname)) {
       if (exemptPaths.includes(pathname)) {
           setIsLoading(false); // Ensure loading stops if path is exempt
       }
       return;
    }

    const checkUserSession = async () => {
      // Avoid setting loading true if already not loading (prevents flicker)
      if (isLoading) setIsLoading(true);

      try {
        // Increment view first (updateUserSession handles insert/update)
        await updateUserSession(userId);

        // Then check the latest count and paywall status
        const res = await fetch(`/api/check-paywall?userId=${userId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch paywall status: ${res.statusText}`);
        }
        const data = await res.json();

        setViewsCount(data.viewsCount ?? 0); // Update views count state

        if (data.showPaywall) {
          setShowPaywall(true);
        } else {
          setShowPaywall(false);
        }
      } catch (err) {
        console.error("[page.tsx] Session update/check error:", err);
        // Optionally show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
    // Dependency array includes userId and pathname to re-run if they change
  }, [userId, pathname]); // Removed isLoading, exemptPaths from dependencies

  // Show loading indicator during the initial check (only on non-exempt pages)
  if (isLoading && !exemptPaths.includes(pathname)) {
    return <div className="text-center py-10">Loading...</div>;
  }

  // Show paywall if required (and not on an exempt path)
  if (showPaywall && !exemptPaths.includes(pathname)) {
    return <Paywall />;
  }

  // --- Render Page Content if not loading and not paywalled ---
  // (Only render main content if on the root path '/')
  if (pathname !== '/') {
      // For exempt paths like /terms-of-service, the actual page component defined
      // in those route segments will render instead via Next.js routing.
      // We return null here to prevent the HomePage content from rendering on top.
      return null;
  }

  return (
    <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
      <header className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            className="w-20 h-20"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1 text-[#0c372b]">
              <span>First Serve</span> <span>Seattle</span>
            </h1>
            <p className="text-base md:text-lg font-semibold">
              Today's Open Tennis and Pickleball Courts
            </p>
          </div>
        </div>
        <Button
          asChild
          className="bg-[#0c372b] hover:bg-[#0c372b]/90 whitespace-nowrap text-white mt-4 md:mt-0"
        >
          <a href="https://firstserveseattle.com/signup">Get Unlimited Views</a>
        </Button>
      </header>

      {/* Display Views Counter - Conditional rendering not needed here
          as this whole block only renders if showPaywall is false */}
      <ViewsCounter viewsCount={viewsCount} />

      <Suspense fallback={<div className="text-center mt-8">Loading courts...</div>}>
        <TennisCourtList />
      </Suspense>

      {/* Side-by-side buttons: future reservations & local tennis league */}
      <div className="mt-8 text-center space-x-4">
        <Button asChild className="gap-2">
          <a
            href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            For future reservations, book here
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild className="gap-2">
          <a
            href="http://www.tennis-seattle.com?From=185415"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join a Local Tennis League
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t pt-6 text-center text-sm">
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-4">
          <a
            href="/privacy-policy"
            className="text-black hover:text-black transition-colors whitespace-nowrap"
          >
            Privacy Policy
          </a>
          <span className="text-black hidden md:inline">|</span>
          <a
            href="/terms-of-service"
            className="text-black hover:text-black transition-colors whitespace-nowrap"
          >
            Terms of Service
          </a>
          <span className="text-black hidden md:inline">|</span>
          <Button
            asChild
            variant="link"
            className="text-black hover:text-black transition-colors whitespace-nowrap"
          >
            <a href="mailto:support@firstserveseattle.com">Questions?</a>
          </Button>
        </div>
      </footer>
    </div>
  );
}