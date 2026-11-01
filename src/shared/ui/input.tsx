// Adapted from shadcn/ui with the catalog Tailwind prefix.
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

export const fieldClassName =
  "catalog:flex catalog:min-h-10 catalog:w-full catalog:rounded-md catalog:border catalog:border-input catalog:bg-background catalog:px-3 catalog:py-2 catalog:text-sm catalog:text-foreground catalog:shadow-sm catalog:focus-visible:outline-none catalog:focus-visible:ring-2 catalog:focus-visible:ring-ring catalog:disabled:cursor-not-allowed catalog:disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClassName, "catalog:min-h-24", className)} {...props} />;
}
