"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import TennisCourtList from "../tennis-courts/components/TennisCourtList"; // Importing the court list component

export default function MembersPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);

      // Get authenticated user
      const { data: authUser, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser?.user) {
        router.push("/signin"); // Redirect to sign-in if not authenticated
        return;
      }

      setUser(authUser.user);

      // Check subscription status
      const { data: subscriber, error: subError } = await supabase
        .from("subscribers")
        .select("status")
        .eq("email", authUser.user.email)
        .single();

      if (subError || !subscriber || subscriber.status !== "active") {
        router.push("/subscribe"); // Redirect to subscription page if no active subscription
        return;
      }

      setSubscription(subscriber);
      setLoading(false);
    }

    fetchUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-8 md:pt-10 pb-6 md:pb-8 max-w-4xl bg-white text-black">
      <header className="flex items-center mb-8">
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
              <span>First Serve</span>{" "}
              <span>Seattle</span>
            </h1>
            <p className="text-base md:text-lg font-semibold">
              Today&#39;s Open Tennis and Pickleball Courts
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="text-center mt-8">Loading courts...</div>}>
        <TennisCourtList />
      </Suspense>

      <div className="mt-8 text-center">
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
      </div>

      <footer className="mt-12 border-t pt-6 text-center text-sm">
        <div className="flex justify-center gap-4">
          <a href="/privacy-policy" className="hover:text-black transition-colors">
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="hover:text-black transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}