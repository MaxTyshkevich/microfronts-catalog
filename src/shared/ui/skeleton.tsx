import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "catalog:rounded-md catalog:bg-muted catalog:motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
