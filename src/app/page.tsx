/* src/app/page.tsx */
"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Paywall from "./tennis-courts/components/paywall";
// No longer importing updateUserSession directly
import TennisCourtList from "./tennis-courts/components/TennisCourtList";
import ViewsCounter from "./tennis-courts/components/counter";

// Define exemptPaths OUTSIDE the component function scope
const exemptPaths = ["/reset-password", "/login", "/signup", "/members", "/privacy-policy", "/terms-of-service"];

export default function HomePage() {
  const pathname = usePathname();
  const [showPaywall, setShowPaywall] = useState(false);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Still use loading state for the combined check

  // First useEffect: Set userId, depends on pathname
  useEffect(() => {
    // Skip userId generation/check on exempt paths
    if (exemptPaths.includes(pathname)) {
        setIsLoading(false); // Don't show loading for exempt paths
        return;
    }
    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("userId", storedId);
      console.log("[page.tsx] Generated new userId:", storedId);
    } else {
       console.log("[page.tsx] Found existing userId:", storedId);
    }
    setUserId(storedId);
  }, [pathname]); // Re-run if pathname changes

  // Second useEffect: Check session using the NEW API, depends on userId and pathname
  useEffect(() => {
    // Only run if userId is set AND it's not an exempt path
    if (!userId || exemptPaths.includes(pathname)) {
        if(exemptPaths.includes(pathname)) {
            setIsLoading(false); // Ensure loading is off for exempt paths
        }
        // If userId is null OR path is exempt, don't proceed with API call
      return;
    }

    let isMounted = true; // Flag to prevent state updates on unmounted component
    const checkAndUpdateSession = async () => {
      console.log(`[page.tsx] Calling /api/update-and-check-session for userId: ${userId}`);
      setIsLoading(true); // Start loading before the API call
      try {
        const response = await fetch(`/api/update-and-check-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: userId }), // Send userId in the body
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
           console.error(`[page.tsx] API error response (${response.status}):`, errorData);
           throw new Error(
            `Failed to update/check session: ${response.statusText} - ${errorData?.error || 'Unknown API error'}`
          );
        }

        const data = await response.json();

        if (isMounted) {
          console.log("[page.tsx] API Response:", data);
          setViewsCount(data.viewsCount ?? 0);
          setShowPaywall(data.showPaywall ?? false);
        }
      } catch (err) {
        if (isMounted) {
            // Log error but maybe allow app to load without paywall check? Or show error state?
           console.error("[page.tsx] Error calling update-and-check API:", err);
           // Optionally set an error state here to display to the user
           // setErrorState("Could not verify usage limits. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false); // Stop loading after API call completes or fails
        }
      }
    };

    checkAndUpdateSession();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
        console.log("[page.tsx] Unmounting or userId/pathname changed, cleanup running.");
        isMounted = false;
    };
  }, [userId, pathname]); // Re-run this effect if userId or pathname changes

  // --- Render logic ---
   console.log(`[page.tsx] Render check: isLoading=${isLoading}, showPaywall=${showPaywall}, pathname=${pathname}, userId=${userId}`);

  // Show Loading indicator ONLY if not on an exempt path and isLoading is true
  if (isLoading && !exemptPaths.includes(pathname)) {
     console.log("[page.tsx] Rendering Loading state...");
     return <div className="text-center py-10">Loading...</div>;
  }

  // Show Paywall if needed and not exempt
  if (showPaywall && !exemptPaths.includes(pathname)) {
     console.log("[page.tsx] Rendering Paywall...");
     return <Paywall />;
  }

  // Don't render anything specific for exempt paths from this component
  if (exemptPaths.includes(pathname)) {
    console.log("[page.tsx] Rendering null (exempt path)");
     return null;
  }

  // Render main content (court list) if not loading, not paywalled, and on the root path
  // We added the check `pathname === '/'` to ensure this only renders on the home page
  if (pathname === '/') {
     console.log("[page.tsx] Rendering Main Content (ViewsCounter + TennisCourtList)...");
     return (
      // Use a fragment or div to wrap multiple components
      <>
        <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
          {/* Updated Header: Removed the Button */}
          <header className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                alt="First Serve Seattle Logo"
                width={80}
                height={80}
                className="w-20 h-20"
                priority // Load logo faster
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-1 text-[#0c372b]">
                  <span>First Serve</span> <span>Seattle</span>
                </h1>
                {/* ===================== FIX HERE ===================== */}
                <p className="text-base md:text-lg font-semibold">
                  Today&apos;s Open Tennis and Pickleball Courts
                </p>
                {/* ==================================================== */}
              </div>
            </div>
            {/* <<<< The Button component previously here is now REMOVED >>>> */}
          </header>

          {/* Show counter only if paywall isn't active */}
          {!showPaywall && <ViewsCounter viewsCount={viewsCount} />}

           {/* Suspense for client-side fetching within TennisCourtList (will be improved in Suggestion 2) */}
          <Suspense fallback={<div className="text-center mt-8 text-gray-600 animate-pulse">Loading courts...</div>}>
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
      </>
    );
  }

   console.log("[page.tsx] Rendering null (default fallback)");
  // Default return if none of the above conditions match (e.g., unexpected path)
  return null;
}