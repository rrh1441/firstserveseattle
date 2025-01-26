// app/signup/page.tsx
"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("basic"); // or "pro" or whatever

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up using Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // If you want, you can pass name, etc. in user_metadata here
      // options: { data: { full_name: ... } },
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

    // 2. Create a Stripe Checkout session on the server
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }), // pass the chosen plan
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(`Failed to create checkout session: ${errMsg}`);
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No session URL returned.");
      }

      // 3. Redirect user to Stripe Checkout
      window.location.href = url; // or router.push(url)
    } catch (err: any) {
      alert("Error creating checkout session: " + err.message);
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