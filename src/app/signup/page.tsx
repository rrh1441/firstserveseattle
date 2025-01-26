"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
// If you're actually using Supabase:
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Grab plan from the URL, e.g. /signup?plan=monthly
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan");
  const plan = planFromUrl === "annual" ? "annual" : "monthly";

  // If you want to sign up with Supabase:
  const supabase = createClientComponentClient();

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(`Sign-up error: ${error.message}`);
      }
      if (!data.user) {
        throw new Error("No user was returned after sign-up.");
      }

      // 2. Create a checkout session for monthly or annual
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to create checkout session: ${errText}`);
      }

      const json = (await res.json()) as { url?: string; error?: string };
      if (!json.url) {
        throw new Error(json.error || "No session URL returned from API.");
      }

      // 3. Redirect the user to Stripe Checkout
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
      <p>Chosen plan: {plan}</p>

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