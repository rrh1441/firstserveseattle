import type { ReactNode } from "react";
import type { Metadata } from "next";
import { TestWorkflowLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestWorkflowLayout({ children }: { children: ReactNode }) {
  return <TestWorkflowLayoutClient>{children}</TestWorkflowLayoutClient>;
}
