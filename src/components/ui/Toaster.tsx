"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      expand={false}
      visibleToasts={4}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "border border-border bg-card text-card-foreground shadow-floating",
          title: "text-sm font-semibold text-foreground",
          description: "text-sm text-muted-foreground",
          actionButton:
            "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
          cancelButton:
            "rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground",
          closeButton:
            "border-border bg-card text-muted-foreground hover:bg-muted",
        },
      }}
    />
  );
}