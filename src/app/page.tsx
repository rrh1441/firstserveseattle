/* src/app/page.tsx */
"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Paywall from "./tennis-courts/components/paywall";
// No longer importing updateUserSession
import TennisCourtList from "./tennis-courts/components/TennisCourtList";
import ViewsCounter from "./tennis-courts/components/counter";
import { ExternalLink } from "lucide-react";

const exemptPaths = ["/reset-password", "/login", "/signup", "/members", "/privacy-policy", "/terms-of-service"];

// Simple Loading Component
const LoadingIndicator = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-lg text-gray-600 animate-pulse">Loading Courts...</p>
    </div>
);


export default function HomePage() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewData, setViewData] = useState<{ count: number; showPaywall: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect 1: Set or get userId
  useEffect(() => {
    if (exemptPaths.includes(pathname)) {
      setIsLoading(false);
      setViewData(null);
      setUserId(null);
      console.log("[page.tsx] Exempt path, skipping user ID and view check.");
      return;
    }

    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("userId", storedId);
      console.log("[page.tsx] New userId generated:", storedId);
    } else {
      console.log("[page.tsx] Found userId:", storedId);
    }
    setUserId(storedId);
  }, [pathname]);


  // Effect 2: Update session count AND check paywall status via API
  const updateAndCheckViewStatus = useCallback(async () => {
    if (!userId || exemptPaths.includes(pathname)) {
      console.log(`[page.tsx] Skipping view update/check. userId: ${userId}, pathname: ${pathname}`);
      if (exemptPaths.includes(pathname)) setIsLoading(false);
      return;
    }

    console.log(`[page.tsx] Starting view update/check via API for userId: ${userId}`);
    setIsLoading(true);
    setError(null);

    try {
      // Call the combined API route using POST
      console.log(`[page.tsx] POSTing to /api/update-and-check-views for ${userId}`); // UPDATE ROUTE NAME IF DIFFERENT
      const res = await fetch(`/api/update-and-check-views`, { // <-- Make sure this is your new API route path
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId }),
      });

      console.log(`[page.tsx] API Response Status: ${res.status} for ${userId}`);

      if (!res.ok) {
          const errorText = await res.text();
          let detail = errorText;
          try {
              const errorJson = JSON.parse(errorText);
              detail = errorJson.error || errorJson.message || errorText;
          // --- FIX: Rename unused variable ---
          } catch (_parseError) { // Renamed parseError to _parseError
          // --- END FIX ---
              // Keep original text if not JSON
          }
          throw new Error(`Failed to update/check view status (${res.status}): ${detail}`);
      }

      const data = await res.json();
      console.log(`[page.tsx] API Response Data for ${userId}:`, data);

      if (data && typeof data.viewsCount !== 'undefined' && typeof data.showPaywall !== 'undefined') {
          setViewData({ count: data.viewsCount, showPaywall: data.showPaywall });
          console.log(`[page.tsx] State Updated for ${userId}: viewsCount=${data.viewsCount}, showPaywall=${data.showPaywall}`);
      } else {
           throw new Error("Invalid data received from view update/check API.");
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("[page.tsx] Error during view update/check:", message);
      setError(`Error loading view status. Please try refreshing.`);
      setViewData(null);
    } finally {
      setIsLoading(false);
      console.log(`[page.tsx] Finished view update/check cycle for ${userId}. Loading set to false.`);
    }
  }, [userId, pathname]);


  useEffect(() => {
      if(userId && !exemptPaths.includes(pathname)){
          updateAndCheckViewStatus();
      } else if (!userId && !exemptPaths.includes(pathname)) {
          console.log("[page.tsx] Waiting for userId before checking view status.");
          setIsLoading(true);
      }
  }, [userId, pathname, updateAndCheckViewStatus]);


  // --- Render Logic ---
  // (Console logs for debugging - can be removed later)
  // console.log(`[page.tsx] Rendering decision: isLoading=${isLoading}, viewData=`, viewData, `pathname=${pathname}`);

  if (exemptPaths.includes(pathname)) {
    return null;
  }
  if (isLoading) {
    return <LoadingIndicator />;
  }
  if (error) {
     return (
        <div className="container mx-auto p-4 text-center">
            <p className="text-red-600 bg-red-50 p-4 rounded border border-red-200">{error}</p>
        </div>
     );
  }
  if (viewData?.showPaywall) {
    return <Paywall />;
  }

  if (viewData && pathname === '/') {
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
          </header>

          <ViewsCounter viewsCount={viewData.count} />

          <Suspense fallback={<LoadingIndicator />}>
            <TennisCourtList />
          </Suspense>

          <div className="mt-8 text-center space-x-0 space-y-3 sm:space-x-4 sm:space-y-0">
            <Button asChild className="gap-2 w-full sm:w-auto">
              <a
                href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book Future Reservations
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild className="gap-2 w-full sm:w-auto">
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

          <footer className="mt-12 border-t pt-6 text-center text-sm">
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
              <a href="/privacy-policy" className="text-black hover:text-gray-700 transition-colors whitespace-nowrap">Privacy Policy</a>
              <span className="text-gray-400 hidden md:inline">|</span>
              <a href="/terms-of-service" className="text-black hover:text-gray-700 transition-colors whitespace-nowrap">Terms of Service</a>
              <span className="text-gray-400 hidden md:inline">|</span>
              {/* Check carefully around here (line ~176) in your code for any stray apostrophes */}
              <Button asChild variant="link" className="text-black hover:text-gray-700 transition-colors whitespace-nowrap p-0 h-auto">
                <a href="mailto:support@firstserveseattle.com">Questions?</a>
              </Button>
            </div>
          </footer>
        </div>
      );
  }

  return null; // Fallback
}