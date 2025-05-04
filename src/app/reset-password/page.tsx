// Corrected logic for src/app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // To wait for potential session recovery

  // Listen for auth state changes to know when the session from the fragment is processed
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
         // Check specifically for the PASSWORD_RECOVERY event
         if (event === "PASSWORD_RECOVERY") {
            console.log("Password recovery event detected, ready to update.");
            setIsReady(true);
         } else if (event === "SIGNED_IN") {
            // Could also indicate readiness if signed in via recovery
             console.log("Signed in event detected during potential recovery.");
             setIsReady(true);
         }
          // Handle other events if needed, e.g., redirect if already signed in normally
          // else if (session && event !== "PASSWORD_RECOVERY") {
          // router.push('/'); // Or wherever signed-in users should go
          //}
      }
    );

     // Initial check in case the event fired before listener attached
     // Check if the URL has the recovery fragment
     if (window.location.hash.includes('type=recovery')) {
        console.log("Recovery fragment detected on initial load.");
        // Give Supabase a moment to process the fragment if needed
        setTimeout(() => setIsReady(true), 50);
     } else {
        // If no recovery fragment, maybe show an error or redirect
         console.log("No recovery fragment detected.");
         // setError("Invalid or expired password reset link.");
         // setIsReady(true); // Allow rendering error state if needed
     }


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth, router]);


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
     if (!isReady) {
         setError("Waiting for session recovery... Please wait a moment.");
         return;
     }

    setLoading(true);

    try {
       // Directly update the user's password.
       // Supabase client handles the session context from the URL fragment.
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Check for specific errors, e.g., weak password
        if (updateError.message.includes("Password should be at least 6 characters")) {
             setError("Password must be at least 6 characters long.");
         } else {
             setError(`Failed to update password: ${updateError.message}`);
         }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login"); // Redirect to login page
      }, 3000);

    } catch (err: unknown) {
      setError( err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Optional: Add a loading state before 'isReady' is true
  // if (!isReady && !error) {
  //   return <div>Verifying link...</div>;
  // }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
       <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
         <h1 className="text-2xl font-bold text-center mb-4">Set New Password</h1>
         {success ? (
           <p className="text-green-500 text-sm text-center mb-4">
             Password updated successfully! Redirecting to login...
           </p>
         ) : (
           <form onSubmit={handleResetPassword}>
             {error && (
               <p className="text-red-500 text-sm text-center mb-4">{error}</p>
             )}
             {!isReady && !error && (
                 <p className="text-blue-500 text-sm text-center mb-4">Verifying reset link...</p>
             )}
             <div className="mb-4">
               <label htmlFor="password" /* ... */>New Password</label>
               <input
                 id="password" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 /* ... */ required disabled={!isReady || loading}
               />
             </div>
             <div className="mb-6">
               <label htmlFor="confirmPassword" /* ... */>Confirm Password</label>
               <input
                 id="confirmPassword" type="password" value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 /* ... */ required disabled={!isReady || loading}
               />
             </div>
             <button type="submit" /* ... */ disabled={!isReady || loading}>
               {loading ? "Updating..." : "Set New Password"}
             </button>
           </form>
         )}
       </div>
     </div>
  );
}