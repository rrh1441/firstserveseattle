import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestcLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        footer, .site-footer { display: none !important; }
        main { padding-bottom: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
