import { Analytics } from "@vercel/analytics/react";
// No need to import 'Script' if placing directly in <head>
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
        {/* Metadata tags (like title, description) are automatically 
          handled by Next.js based on the 'metadata' export above. 
          Only add tags here that aren't covered by the metadata object.
        */}

        {/* Your DataFast script, correctly formatted for TSX/JSX */}
        <script
          defer
          data-website-id="67e42faaad4cc8e626767b22"
          data-domain="firstserveseattle.com"
          src="https://datafa.st/js/script.js"
        ></script> 
        {/* You can use self-closing <script ... /> if preferred, but <script></script> is also valid */}

      </head>
      <body>
        {children}
        <Analytics /> {/* Vercel Analytics */}
      </body>
    </html>
  );
}