/* src/app/page.tsx */
"use client";

import { useEffect, useState, Suspense } from "react"; // Removed useMemo, not needed for constant
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Paywall from "./tennis-courts/components/paywall";
import { updateUserSession } from "@/lib/updateUserSessions";
import TennisCourtList from "./tennis-courts/components/TennisCourtList";
import ViewsCounter from "./tennis-courts/components/counter";

// Define exemptPaths OUTSIDE the component function scope
// This makes it a stable constant across renders.
const exemptPaths = ["/reset-password", "/login", "/signup", "/members", "/privacy-policy", "/terms-of-service"];

export default function HomePage() {
  const pathname = usePathname();
  const [showPaywall, setShowPaywall] = useState(false);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Keep isLoading state

  // First useEffect: Set userId, depends on pathname
  useEffect(() => {
    // Check against the constant exemptPaths array
    if (exemptPaths.includes(pathname)) {
       setIsLoading(false);
       return;
    }

    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("userId", storedId);
    }
    setUserId(storedId);
    // No dependency on exemptPaths needed here as it's a constant defined outside
  }, [pathname]);

  // Second useEffect: Check session, depends on userId and pathname
  useEffect(() => {
    // Check against the constant exemptPaths array
    if (!userId || exemptPaths.includes(pathname)) {
       if (exemptPaths.includes(pathname)) {
           setIsLoading(false);
       }
       return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component

    const checkUserSession = async () => {
      // Set loading true at the start of the check
      setIsLoading(true);

      try {
        await updateUserSession(userId);
        const res = await fetch(`/api/check-paywall?userId=${userId}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch paywall status: ${res.statusText}`);
        }
        const data = await res.json();

        // Only update state if the component is still mounted
        if (isMounted) {
            setViewsCount(data.viewsCount ?? 0);
            setShowPaywall(data.showPaywall ?? false); // Update based on fetched data
        }
      } catch (err) {
        if (isMounted){
             console.error("[page.tsx] Session update/check error:", err);
             // Consider setting an error state here to show user
        }
      } finally {
        // Only update loading state if the component is still mounted
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    checkUserSession();

    // Cleanup function to set the mounted flag to false when component unmounts
    return () => {
        isMounted = false;
    };
    // Dependencies are userId and pathname
  }, [userId, pathname]);

  // --- Render logic ---
  if (isLoading && !exemptPaths.includes(pathname)) {
    return <div className="text-center py-10">Loading...</div>;
  }
  if (showPaywall && !exemptPaths.includes(pathname)) {
    return <Paywall />;
  }
  if (exemptPaths.includes(pathname)) {
      // Let Next.js handle rendering for these specific paths
      return null;
  }
  // Only render the main content if it's the root path
  if (pathname === '/') {
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
                  {/* Use &apos; for the apostrophe */}
                  Today&apos;s Open Tennis and Pickleball Courts
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

          {/* Render the counter */}
          <ViewsCounter viewsCount={viewsCount} />

          {/* Render the list */}
          <Suspense fallback={<div className="text-center mt-8">Loading courts...</div>}>
            <TennisCourtList />
          </Suspense>

          {/* Action buttons */}
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
  // Default return if not loading, not paywalled, and not an exempt or root path
  return null;
}