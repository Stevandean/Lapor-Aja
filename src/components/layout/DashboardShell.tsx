"use client";

import { useState } from "react";
import { DashboardNavbar } from "@/src/components/layout/DashboardNavbar";
import { DashboardSidebar } from "@/src/components/layout/DashboardSidebar";
import type { NavbarNotification } from "@/src/features/notifications/queries";
import type { UserProfile } from "@/src/types/profile";

type DashboardShellProps = {
  profile: UserProfile;
  notifications: NavbarNotification[];
  children: React.ReactNode;
};

export function DashboardShell({
  profile,
  notifications,
  children,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <DashboardSidebar
          profile={profile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <DashboardNavbar
            profile={profile}
            notifications={notifications}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
