'use client';

import { useEffect } from 'react';
import TestWorkflowPage from './testworkflow/page';

export default function HomePage() {
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

  return <TestWorkflowPage />;
}
