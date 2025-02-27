"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TennisCourtList from "../tennis-courts/components/TennisCourtList";

export default function MembersPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // ----------------------------------------------------------------------
  // Added state variables to handle loading, subscription status, etc.
  // ----------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(
    null
  );
  const [portalLoading, setPortalLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ----------------------------------------------------------------------
  // 1. Check session + subscription status
  // ----------------------------------------------------------------------
  useEffect(() => {
    const checkSessionAndSubscription = async () => {
      try {
        // First, get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setFetchError("Error retrieving session.");
          setIsLoading(false);
          return;
        }

        // If there's no session, redirect to login
        if (!session) {
          router.push("/login");
          return;
        }

        // Store the access token for later use (manage subscription portal)
        setSessionAccessToken(session.access_token);

        // ------------------------------------------------------------------
        // Check subscription status in your `subscribers` table:
        //  - The user's ID in Supabase is session.user.id
        //  - We need the "status" field (should be "active" if subscription is good)
        // ------------------------------------------------------------------
        const { data: subscriberData, error: subError } = await supabase
          .from("subscribers")
          .select("status")
          .eq("id", session.user.id)
          .single();

        if (subError) {
          console.error("Error fetching subscription status:", subError);
          setFetchError("Error retrieving subscription status.");
          setIsLoading(false);
          return;
        }

        // If no row in `subscribers`, or status is not 'active', we treat it as unsubscribed
        if (!subscriberData || subscriberData.status !== "active") {
          // Immediately redirect to the paywall if subscription is not active
          router.push("/signup?plan=monthly"); // or to any paywall page you prefer
          return;
        }

        // If we got here, the user has an active subscription
        setIsSubscriptionActive(true);
      } catch (err) {
        console.error("Unhandled subscription check error:", err);
        setFetchError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndSubscription();
  }, [router, supabase]);

  // ----------------------------------------------------------------------
  // 2. "Manage Subscription" portal link
  // ----------------------------------------------------------------------
  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/create-portal-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use "Bearer <token>" for Supabase to authenticate
          Authorization: sessionAccessToken ? `Bearer ${sessionAccessToken}` : "",
        },
      });

      if (!response.ok) {
        throw new Error(`Error creating portal link: ${response.statusText}`);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create portal link:", err);
      setFetchError(err instanceof Error ? err.message : "Portal link error.");
    } finally {
      setPortalLoading(false);
    }
  }

  // ----------------------------------------------------------------------
  // 3. Render states
  // ----------------------------------------------------------------------
  if (isLoading) {
    return <div className="text-center py-8">Checking membership...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center py-8 text-red-500">
        {fetchError} — please refresh or contact support.
      </div>
    );
  }

  // If the subscription is not active, we already redirected,
  // but just in case:
  if (!isSubscriptionActive) {
    return null; // or a backup message if needed
  }

  // ----------------------------------------------------------------------
  // 4. The main members-only view
  // ----------------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
      <header className="flex justify-between items-center mb-8">
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
      </header>

      {/* The members-only content */}
      <TennisCourtList />

      {/* Buttons styled as in page.tsx */}
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

      {/* Responsive Footer with an additional 'Manage Subscription' link */}
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
            onClick={handleManageSubscription}
            variant="link"
            className="text-black hover:text-black transition-colors whitespace-nowrap"
            disabled={portalLoading}
          >
            {portalLoading ? "Loading..." : "Manage Your Subscription"}
          </Button>
          <span className="text-black hidden md:inline">|</span>
          <Button
            asChild
            variant="link"
            className="text-black hover:text-black transition-colors whitespace-nowrap"
          >
            <a href="mailto:support@firstserveseattle.com">Support</a>
          </Button>
        </div>
      </footer>
    </div>
  );
}