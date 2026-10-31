// Adapted from shadcn/ui (new-york), with the catalog Tailwind prefix.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib";

const buttonVariants = cva(
  "catalog:inline-flex catalog:items-center catalog:justify-center catalog:gap-2 catalog:rounded-md catalog:text-sm catalog:font-medium catalog:transition-colors catalog:cursor-pointer catalog:focus-visible:outline-none catalog:focus-visible:ring-2 catalog:focus-visible:ring-ring catalog:focus-visible:ring-offset-2 catalog:disabled:pointer-events-none catalog:disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "catalog:bg-primary catalog:text-primary-foreground catalog:shadow-sm catalog:hover:bg-primary/90",
        outline:
          "catalog:border catalog:border-input catalog:bg-background catalog:text-foreground catalog:hover:bg-accent",
        ghost: "catalog:text-foreground catalog:hover:bg-accent",
      },
      size: {
        default: "catalog:min-h-10 catalog:px-4 catalog:py-2",
        sm: "catalog:min-h-9 catalog:px-3 catalog:py-1.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
