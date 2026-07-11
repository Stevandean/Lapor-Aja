"use client";

import { Menu } from "lucide-react";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import type { NavbarNotification } from "@/src/features/notifications/queries";
import { ROLE_LABELS } from "@/src/lib/constants/roles";
import type { UserProfile } from "@/src/types/profile";

type DashboardNavbarProps = {
  profile: UserProfile;
  notifications: NavbarNotification[];
  onOpenSidebar: () => void;
};

export function DashboardNavbar({
  profile,
  notifications,
  onOpenSidebar,
}: DashboardNavbarProps) {
  const initial = profile.full_name?.charAt(0).toUpperCase() || "U";

  return (
    <header className="print:hidden sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl border border-border bg-card p-2 text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Buka sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="line-clamp-1 text-lg font-semibold text-foreground">
            Selamat datang, {profile.full_name}
          </h1>
        </div>
      </div>

      <div className="print:hidden flex items-center gap-3">
        <NotificationBell notifications={notifications} role={profile.role} />

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">
            {profile.full_name}
          </p>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {initial}
        </div>

        <span className="hidden rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 md:inline-flex">
          {ROLE_LABELS[profile.role]}
        </span>
      </div>
    </header>
  );
}
