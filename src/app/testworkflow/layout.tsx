'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

export default function TestWorkflowLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Hide footer and fix main height for full-screen map
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');

    if (footer) footer.style.display = 'none';
    if (main) main.style.flexGrow = '0';

    return () => {
      // Restore on unmount
      if (footer) footer.style.display = '';
      if (main) main.style.flexGrow = '';
    };
  }, []);

  return <>{children}</>;
}
