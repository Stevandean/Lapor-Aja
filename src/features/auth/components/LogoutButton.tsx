"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/Button";
import { ROUTES } from "@/src/lib/constants/routes";
import { cn } from "@/src/lib/utils";

type LogoutButtonProps = {
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export function LogoutButton({
  className,
  showIcon = true,
  label = "Logout",
}: LogoutButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Logout failed", {
        description: error.message,
      });
      return;
    }

    toast.success("Logged out", {
      description: "You have been signed out successfully.",
    });

    router.replace(ROUTES.LOGIN);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className={cn("justify-start", className)}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}