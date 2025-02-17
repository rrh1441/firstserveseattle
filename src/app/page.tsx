"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Paywall from "./tennis-courts/components/paywall";
import { updateUserSession } from "@/lib/updateUserSessions";
import TennisCourtList from "./tennis-courts/components/TennisCourtList";

export default function HomePage() {
  const pathname = usePathname();
  const [showPaywall, setShowPaywall] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Certain paths are exempt from paywall checks
    const exemptPaths = ["/reset-password", "/login", "/signup", "/members"];
    if (exemptPaths.includes(pathname)) return;

    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("userId", storedId);
    }
    setUserId(storedId);
  }, [pathname]);

  useEffect(() => {
    if (!userId || pathname === "/reset-password") return;

    const checkUserSession = async () => {
      try {
        await updateUserSession(userId);
        const res = await fetch(`/api/check-paywall?userId=${userId}`);
        const data = await res.json();

        if (data.showPaywall) {
          setShowPaywall(true);
        }
      } catch (err) {
        console.error("[page.tsx] Session update error:", err);
      }
    };

    checkUserSession();
  }, [userId, pathname]);

  if (showPaywall) {
    return <Paywall />;
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

      {/* Original footer with “Questions?” link */}
      <footer className="mt-12 border-t pt-6 text-center text-sm">
        <div className="flex justify-center gap-4">
          <a
            href="/privacy-policy"
            className="hover:text-black transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="hover:text-black transition-colors"
          >
            Terms of Service
          </a>
        </div>
        <div className="mt-4">
          <Button asChild>
            <a href="mailto:support@firstserveseattle.com">Questions?</a>
          </Button>
        </div>
      </footer>
    </div>
  );
}