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

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Access token for the "Manage Subscription" portal link
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(
    null
  );

  // ----------------------------------------------------------------------
  // 1. Check session & subscription status on mount
  // ----------------------------------------------------------------------
  useEffect(() => {
    const checkSessionAndSubscription = async () => {
      try {
        // Get session
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

        // No session => must login
        if (!session) {
          router.push("/login");
          return;
        }

        // For manage-subscription portal
        setSessionAccessToken(session.access_token);

        // 2. Check the subscription status in `subscribers` table
        const { data: subscriberData, error: subError } = await supabase
          .from("subscribers")
          .select("status")
          .eq("id", session.user.id)
          .single();

        if (subError) {
          console.error("Error fetching subscriber row:", subError);
          setFetchError("Error retrieving subscription status.");
          setIsLoading(false);
          return;
        }

        // If no row or not active => redirect user straight to Stripe checkout
        // You can choose a default plan, e.g. "monthly".
        if (!subscriberData || subscriberData.status !== "active") {
          const defaultPlan = "monthly"; // or "annual"

          const response = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: defaultPlan }),
          });
          if (!response.ok) {
            throw new Error(
              `Cannot create checkout session: ${response.statusText}`
            );
          }
          const { url } = await response.json();
          window.location.href = url;
          return;
        }

        // If subscription is active, show the page
      } catch (err: unknown) {
        console.error("Unhandled subscription check error:", err);
        setFetchError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndSubscription();
  }, [router, supabase]);

  // ----------------------------------------------------------------------
  // Manage Subscription portal link
  // ----------------------------------------------------------------------
  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/create-portal-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setFetchError(
        err instanceof Error ? err.message : "Portal link error, please try again."
      );
    } finally {
      setPortalLoading(false);
    }
  }

  // ----------------------------------------------------------------------
  // 3. Render states
  // ----------------------------------------------------------------------
  if (isLoading) {
    return <div className="text-center py-8">Checking membership status...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center py-8 text-red-500">
        {fetchError} — please refresh or contact support.
      </div>
    );
  }

  // If subscription was inactive, we already redirected to Stripe checkout.
  // If code reaches here, the user is active.
  return (
    <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
      {/* Use flex-col on small, row on md+ screens, with items centered */}
      <header className="flex flex-col md:flex-row items-center md:justify-between mb-8 gap-4">
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

        {/* Top "Manage Your Subscription" button aligned on the right for md+ */}
        <Button
          onClick={handleManageSubscription}
          className="bg-[#0c372b] hover:bg-[#0c372b]/90 whitespace-nowrap text-white"
          disabled={portalLoading}
        >
          {portalLoading ? "Loading..." : "Manage Your Subscription"}
        </Button>
      </header>

      <TennisCourtList />

      {/* Some extra calls to action, if desired */}
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

      {/* Footer with 'Manage Subscription' */}
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