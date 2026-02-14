"use client";

import * as React from "react";
import { cn } from "../lib/utils.ts";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("db-scrollarea relative min-h-0", className)} {...props}>
        <div className={cn("db-scrollarea-viewport h-full w-full overflow-auto", viewportClassName)}>{children}</div>
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";

