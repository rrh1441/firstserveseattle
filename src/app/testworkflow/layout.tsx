import type { ReactNode } from 'react';

export default function TestWorkflowLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        footer { display: none !important; }
        main { flex-grow: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
