"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { markNavbarNotificationsAsRead } from "@/src/features/notifications/actions";
import type { NavbarNotification } from "@/src/features/notifications/queries";
import type { UserRole } from "@/src/types/profile";

type NotificationBellProps = {
  notifications: NavbarNotification[];
  role: UserRole;
};

export function NotificationBell({
  notifications,
  role,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
        aria-label="Buka notifikasi"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-600 px-1.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Notifikasi
              </p>
              <p className="text-xs text-muted-foreground">
                {unreadCount} belum dibaca
              </p>
            </div>

            {notifications.length > 0 ? (
              <form action={markNavbarNotificationsAsRead}>
                <Button type="submit" variant="outline" size="sm">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Tandai Dibaca
                </Button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                Belum ada notifikasi
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pembaruan yang perlu Anda perhatikan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  role={role}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationItem({
  notification,
  role,
}: {
  notification: NavbarNotification;
  role: UserRole;
}) {
  const href = notification.report_id
    ? getReportHref(role, notification.report_id)
    : null;
  const content = (
    <div className="flex gap-3 border-b border-border px-4 py-3 transition last:border-b-0 hover:bg-muted/50">
      <span
        className={
          notification.read_at
            ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-border"
            : "mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
        }
      />

      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {notification.subject}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDateTime(notification.sent_at || notification.created_at)}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

function getReportHref(role: UserRole, reportId: string) {
  if (role === "admin") {
    return `/dashboard/admin/reports/${reportId}`;
  }

  if (role === "kepala_desa" || role === "sekdes") {
    return `/dashboard/village/reports/${reportId}`;
  }

  if (role === "kepala_dusun") {
    return `/dashboard/hamlet-head/verification/${reportId}`;
  }

  if (role === "kasi") {
    return `/dashboard/kasi/reports/${reportId}`;
  }

  return `/dashboard/public/reports/${reportId}`;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
