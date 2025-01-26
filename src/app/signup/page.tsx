// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// If you're not using the router, remove the import below.
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("basic");
  const [loading, setLoading] = useState(false);

  // Remove or use it. If you don't need router, delete this line to avoid the ESLint warning:
  const router = useRouter(); // If you do want to redirect within the app, keep it and use it.

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up using Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("Error signing up: " + error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      alert("Sign-up failed; no user returned.");
      setLoading(false);
      return;
    }

    // 2. Create a Stripe Checkout session
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg);
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No URL returned from checkout session.");
      }

      // 3. Redirect the user to Stripe Checkout
      // Option A: direct
      window.location.href = url;

      // Option B: using Next.js router
      // router.push(url);

      // We do not set `loading` to false here, because the user leaves the site.
    } catch (err: unknown) {
      let errorMessage = "Unknown error";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      alert("Error creating checkout session: " + errorMessage);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignUp}>
        <label>
          Email:
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </label>
        <br />
        <label>
          Plan:
          <select onChange={(e) => setPlan(e.target.value)} value={plan}>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Sign Up & Checkout"}
        </button>
      </form>
    </div>
  );
}