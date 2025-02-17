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
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for an authenticated session and retrieve the access token.
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        router.push("/login");
      } else {
        setAccessToken(session.access_token);
        setLoading(false);
      }
    }
    checkSession();
  }, [router, supabase]);

  // Handle the "Manage Subscription" click by calling your API.
  async function handleManageSubscription() {
    setLoadingPortal(true);
    try {
      const response = await fetch("/api/create-portal-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
      });

      if (!response.ok) {
        throw new Error(`Error creating portal link: ${response.statusText}`);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Failed to create portal link:", err);
    } finally {
      setLoadingPortal(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

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

      {/* Responsive Footer with an additional Support link */}
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
            disabled={loadingPortal}
          >
            {loadingPortal ? "Loading..." : "Manage Your Subscription"}
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