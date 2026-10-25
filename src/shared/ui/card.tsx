// Adapted from shadcn/ui (new-york), with the catalog Tailwind prefix.
import type { ComponentProps } from "react";
import { cn } from "../lib";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "catalog:rounded-xl catalog:border catalog:border-border catalog:bg-card catalog:text-card-foreground catalog:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("catalog:flex catalog:flex-col catalog:gap-2 catalog:p-6", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("catalog:p-6 catalog:pt-0", className)} {...props} />;
}
