// src/app/members/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
// Reverted to alias import for Button
import { Button } from "@/components/ui/button";
// Use relative path for TennisCourtList as it's part of a different feature area
import TennisCourtList from "../tennis-courts/components/TennisCourtList";

export default function MembersPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(
    null
  );

  useEffect(() => {
    const checkSessionAndSubscription = async () => {
      try {
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

        if (!session) {
          router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        setSessionAccessToken(session.access_token);

        const { data: subscriberData, error: subError } = await supabase
          .from("subscribers")
          .select("status")
          .eq("id", session.user.id)
          .single();

        if (subError && subError.code !== 'PGRST116') {
          console.error("Error fetching subscriber row:", subError);
          setFetchError("Error retrieving subscription status.");
          setIsLoading(false);
          return;
        }

        if (!subscriberData || subscriberData.status !== "active") {
          console.log("No active subscription found, redirecting to checkout.");
          const defaultPlan = "monthly";

          const response = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: defaultPlan }),
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Cannot create checkout session: ${response.statusText} - ${errorText}`
            );
          }
          const { url } = await response.json();
          if (!url) {
             throw new Error("Checkout URL not received from server.");
          }
          window.location.href = url;
          return;
        }

        console.log("Active subscription found. Showing members page.");

      } catch (err: unknown) {
        console.error("Unhandled subscription check error:", err);
        setFetchError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndSubscription();
  }, [router, supabase]);


  async function handleManageSubscription() {
    if (!sessionAccessToken) {
        setFetchError("Cannot manage subscription: Session token missing.");
        return;
    }
    setPortalLoading(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/create-portal-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionAccessToken}`,
        },
      });

      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(`Error creating portal link: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const { url } = await response.json();
       if (!url) {
         throw new Error("Portal URL not received from server.");
       }
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

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Checking membership status...</p></div>;
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500 bg-red-100 border border-red-300 p-4 rounded">
          {fetchError} — please refresh or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
      <header className="flex flex-col md:flex-row items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            className="w-20 h-20"
            priority
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
          onClick={handleManageSubscription}
          className="bg-[#0c372b] hover:bg-[#0c372b]/90 whitespace-nowrap text-white w-full md:w-auto"
          disabled={portalLoading}
        >
          {portalLoading ? "Loading..." : "Manage Your Subscription"}
        </Button>
      </header>

      <TennisCourtList />

      <div className="mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4">
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
          <a
            href="/privacy-policy"
            className="text-black hover:text-gray-700 transition-colors whitespace-nowrap"
          >
            Privacy Policy
          </a>
          <span className="text-gray-400 hidden md:inline">|</span>
          <a
            href="/terms-of-service"
            className="text-black hover:text-gray-700 transition-colors whitespace-nowrap"
          >
            Terms of Service
          </a>
          <span className="text-gray-400 hidden md:inline">|</span>
          <Button
            onClick={handleManageSubscription}
            variant="link"
            className="text-black hover:text-gray-700 transition-colors whitespace-nowrap p-0 h-auto"
            disabled={portalLoading}
          >
            {portalLoading ? "Loading..." : "Manage Your Subscription"}
          </Button>
          <span className="text-gray-400 hidden md:inline">|</span>
          <Button
            asChild
            variant="link"
            className="text-black hover:text-gray-700 transition-colors whitespace-nowrap p-0 h-auto"
          >
            <a href="mailto:support@firstserveseattle.com">Support</a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
