import type { ReactNode } from "react";

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
