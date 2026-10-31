// Adapted from shadcn/ui (new-york), using the catalog theme and Tailwind prefix.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="catalog:fixed catalog:inset-0 catalog:z-50 catalog:bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          "catalog-ui catalog:fixed catalog:left-1/2 catalog:top-1/2 catalog:z-50 catalog:grid catalog:max-h-[90dvh] catalog:w-[calc(100%-2rem)] catalog:max-w-lg catalog:-translate-x-1/2 catalog:-translate-y-1/2 catalog:gap-4 catalog:overflow-y-auto catalog:rounded-lg catalog:border catalog:border-border catalog:bg-background catalog:p-6 catalog:shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="catalog:absolute catalog:right-4 catalog:top-4 catalog:rounded-sm catalog:opacity-70 catalog:cursor-pointer catalog:hover:opacity-100 catalog:focus-visible:outline-none catalog:focus-visible:ring-2 catalog:focus-visible:ring-ring">
          <X size={18} aria-hidden="true" />
          <span className="catalog:sr-only">Закрыть</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
