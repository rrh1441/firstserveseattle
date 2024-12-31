// src/app/layout.tsx

import "./globals.css"

export const metadata = {
  title: "First Serve Seattle",
  description: "Today's Open Tennis and Pickleball Courts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
