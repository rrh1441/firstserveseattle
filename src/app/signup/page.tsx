// ============================
// src/app/signup/page.tsx
// ============================
"use client";

import { useState } from "react";

export default function SignUpPage() {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  // If you have an actual sign-up process (e.g., with Supabase), do it before
  // calling /api/create-checkout-session. For now, this example just focuses
  // on picking a plan and generating the Stripe Checkout session.

  async function handlePurchase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // This is the URL to redirect to Stripe Checkout
      const data = (await response.json()) as { url?: string; error?: string };

      if (!data.url) {
        throw new Error(data.error || "No checkout URL returned.");
      }

      // Redirect user to Stripe
      window.location.href = data.url;
    } catch (error: unknown) {
      let message = "Unknown error.";
      if (error instanceof Error) {
        message = error.message;
      }
      alert(message);
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h1>Select a Plan</h1>

      <form onSubmit={handlePurchase}>
        <label htmlFor="plan-select">
          Plan:
          <select
            id="plan-select"
            value={plan}
            onChange={(e) => setPlan(e.target.value as "monthly" | "annual")}
            style={{ marginLeft: 8 }}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </label>

        <br />
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 12, padding: "6px 12px" }}
        >
          {loading ? "Redirecting..." : "Proceed to Checkout"}
        </button>
      </form>
    </div>
  );
}