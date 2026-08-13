import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * `text-base sm:text-sm` is deliberate: iOS Safari (and the in-app WebViews
 * built on it) auto-zooms when a focused text control computes under 16px,
 * which shifts the layout and pushes the submit button off screen. 16px on
 * phones prevents that; the `sm` breakpoint keeps the 14px look everywhere else.
 */
const fieldStyles =
  "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-base transition-colors placeholder:text-muted-foreground focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-red-500 sm:text-sm";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input ref={ref} className={cn(fieldStyles, className)} {...props} />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldStyles, "min-h-32 resize-y", className)}
      {...props}
    />
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-red-500">{children}</p>;
}
