"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("h-px bg-gray-200 my-4", className)} {...props} />;
  }
);
Separator.displayName = "Separator";

export { Separator };
export default Separator;