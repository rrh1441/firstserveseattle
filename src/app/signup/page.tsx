"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
// Remove if you don't actually need Supabase for sign-up
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = planParam === "annual" ? "annual" : "monthly"; // fallback

  // If you don't need actual sign-up, remove these lines + usage below
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. (Optional) Create the user in Supabase
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw new Error(`Sign-up failed: ${error.message}`);
      }
      if (!data.user) {
        throw new Error("No user returned after sign-up.");
      }

      // 2. Create Stripe Checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { url } = (await response.json()) as { url?: string };
      if (!url) {
        throw new Error("No checkout URL received.");
      }

      // 3. Redirect to Stripe
      window.location.href = url;
    } catch (err: unknown) {
      let message = "Unknown error.";
      if (err instanceof Error) {
        message = err.message;
      }
      setErrorMsg(message);
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Sign Up</h1>
      <p>You chose <strong>{plan}</strong>.</p>

      {errorMsg && (
        <div style={{ color: "red", marginBottom: 8 }}>{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
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