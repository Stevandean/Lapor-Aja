"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, ShieldCheck, X } from "lucide-react";
import { LogoutButton } from "@/src/features/auth/components/LogoutButton";
import { cn } from "@/src/lib/utils";
import type { UserProfile } from "@/src/types/profile";
import {
  getDashboardNavigation,
  type DashboardNavItem,
} from "@/src/components/layout/dashboardNavigation";

type DashboardSidebarProps = {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardSidebar({
  profile,
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <SidebarContent profile={profile} />
    </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "print:hidden fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-floating transition-transform lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
          <Brand />

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav profile={profile} onNavigate={onClose} />

        <div className="border-t border-sidebar-border p-4">
          <LogoutButton className="w-full text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
        </div>
      </aside>
    </>
  );
}

function SidebarContent({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-sidebar-border px-6">
        <Brand />
      </div>

      <SidebarNav profile={profile} />

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <LogoutButton className="w-full text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5" />
      </div>

      <div>
        <p className="font-bold text-white">Lapor Aja</p>
        <p className="text-xs text-sidebar-muted">Village Reporting System</p>
      </div>
    </Link>
  );
}

function SidebarNav({
  profile,
  onNavigate,
}: {
  profile: UserProfile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const menus = getDashboardNavigation(profile.role);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
      {menus.map((item, index) => (
        <SidebarNavItem
          key={item.href ?? `${item.label}-${index}`}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: DashboardNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const isParentActive = item.href
    ? isNavigationItemActive(pathname, item.href)
    : false;

  const isChildActive = Boolean(
    item.children?.some(
      (child) => isNavigationItemActive(pathname, child.href)
    )
  );

  const isActive = isParentActive || isChildActive;
  const [isDropdownOpen, setIsDropdownOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      const timeoutId = window.setTimeout(() => {
        setIsDropdownOpen(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [isActive]);

  if (hasChildren) {
    return (
      <div className="print:hidden space-y-1">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((current) => !current)}
          aria-expanded={isDropdownOpen}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </span>

          {isDropdownOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>

        {isDropdownOpen ? (
          <div className="ml-5 space-y-1 border-l border-sidebar-border pl-3">
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              const childActive = isNavigationItemActive(pathname, child.href);

              return (
                <Link
                  key={`${child.href}-${child.label}`}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    childActive
                      ? "bg-primary/90 text-primary-foreground shadow-sm"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isParentActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function isNavigationItemActive(pathname: string, href: string) {
  const exactMatchOnlyRoutes = [
    "/dashboard",
    "/dashboard/admin",
    "/dashboard/public",
    "/dashboard/hamlet-head",
    "/dashboard/village",
    "/dashboard/kasi",
  ];

  if (exactMatchOnlyRoutes.includes(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
