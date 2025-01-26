"use client";

// This ensures Next.js doesn't try to statically generate the page
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

// If using Supabase for actual sign-up:
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam === "annual" ? "annual" : "monthly"; // fallback to "monthly"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If you want to sign up the user in Supabase:
  const supabase = createClientComponentClient();

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up with Supabase (if needed)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw new Error(`Sign-up error: ${error.message}`);
      }
      if (!data.user) {
        throw new Error("No user returned after sign-up.");
      }

      // 2. Create a checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const json = (await response.json()) as { url?: string; error?: string };
      if (!json.url) {
        throw new Error(json.error || "No URL returned from checkout session.");
      }

      // 3. Redirect to Stripe Checkout
      window.location.href = json.url;
    } catch (err: unknown) {
      let message = "Unknown error occurred.";
      if (err instanceof Error) {
        message = err.message;
      }
      alert(message);
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Sign Up</h1>
      <p>You chose the <strong>{plan}</strong> plan</p>

      <form onSubmit={handleSignUp} style={{ marginTop: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email:
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Password:
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up & Pay"}
        </button>
      </form>
    </div>
  );
}