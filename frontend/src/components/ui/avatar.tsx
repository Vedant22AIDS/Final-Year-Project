// components/ui/avatar.tsx
import * as React from "react";

export function Avatar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative flex shrink-0 overflow-hidden rounded-full ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function AvatarImage({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className ?? ""}`}
      alt={props.alt ?? ""}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}
      {...props}
    >
      {children}
    </span>
  );
}
