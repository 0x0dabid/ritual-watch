import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-11 w-full rounded-md border border-ritual-line bg-white/80 px-3 text-sm text-ritual-ink placeholder:text-ritual-muted",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
