// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata = {
  title: "First Serve Seattle",
  description: "Today's Open Tennis and Pickleball Courts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Metadata tags */}

        {/* === ADDED DATAFAST SCRIPT HERE === */}
        <script
          defer
          data-website-id="67e42faaad4cc8e626767b22" // Replace if you get a different ID
          data-domain="firstserveseattle.com" // Replace if your domain changes
          src="https://datafa.st/js/script.js"
        ></script>
        {/* =================================== */}

      </head>
      <body>
        {children}
        <Analytics /> {/* Vercel Analytics */}
      </body>
    </html>
  );
}