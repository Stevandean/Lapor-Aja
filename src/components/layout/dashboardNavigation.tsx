import {
  Archive,
  ArrowRightCircle,
  BarChart3,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  Home,
  Map,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Building2,
  Timer,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/src/types/profile";

export type DashboardNavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
};

export function getDashboardNavigation(role: UserRole): DashboardNavItem[] {
  const settingsItem = {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  };

  if (role === "admin") {
    return [
      { label: "Overview", href: "/dashboard/admin", icon: Home },
      {
        label: "Reports",
        href: "/dashboard/admin/reports",
        icon: ClipboardList,
      },
      {
        label: "Asset Classification",
        href: "/dashboard/admin/asset-classification",
        icon: Database,
      },
      {
        label: "Follow-up",
        href: "/dashboard/admin/follow-up",
        icon: ArrowRightCircle,
      },
      {
        label: "Archive",
        href: "/dashboard/admin/archive",
        icon: Archive,
      },
      {
        label: "Letters",
        href: "/dashboard/admin/letters",
        icon: FileText,
      },
      {
        label: "Master Data",
        icon: Database,
        children: [
          {
            label: "Categories",
            href: "/dashboard/admin/master-data/categories",
            icon: Tags,
          },
          {
            label: "Dusun",
            href: "/dashboard/admin/master-data/dusuns",
            icon: Map,
          },
          {
            label: "Agencies",
            href: "/dashboard/admin/master-data/agencies",
            icon: Building2,
          },
          {
            label: "Village Sections",
            href: "/dashboard/admin/master-data/village-sections",
            icon: Users,
          },
          {
            label: "SLA Rules",
            href: "/dashboard/admin/master-data/sla-rules",
            icon: Timer,
          },
        ],
      },
      settingsItem,
    ];
  }

  if (role === "kepala_dusun") {
    return [
      { label: "Overview", href: "/dashboard/hamlet-head", icon: Home },
      {
        label: "Reports",
        href: "/dashboard/hamlet-head/reports",
        icon: ClipboardList,
      },
      {
        label: "Verification",
        href: "/dashboard/hamlet-head/verification",
        icon: ShieldCheck,
      },
      {
        label: "History",
        href: "/dashboard/hamlet-head/history",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  if (role === "kepala_desa" || role === "sekdes") {
    return [
      { label: "Overview", href: "/dashboard/village", icon: Home },
      {
        label: "Reports",
        href: "/dashboard/village/reports",
        icon: ClipboardList,
      },
      {
        label: "Analytics",
        href: "/dashboard/village/analytics",
        icon: BarChart3,
      },
      {
        label: "SLA Monitoring",
        href: "/dashboard/village/sla",
        icon: Gauge,
      },
      {
        label: "Budget Requests",
        href: "/dashboard/village/budget-requests",
        icon: Wallet,
      },
      {
        label: "Heatmap",
        href: "/dashboard/village/heatmap",
        icon: Map,
      },
      {
        label: "Users",
        href: "/dashboard/village/users",
        icon: Users,
      },
      {
        label: "Archive",
        href: "/dashboard/village/archive",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  if (role === "kasi") {
    return [
      { label: "Overview", href: "/dashboard/kasi", icon: Home },
      {
        label: "Assigned Reports",
        href: "/dashboard/kasi/reports",
        icon: ClipboardList,
      },
      {
        label: "Budget Proposal",
        href: "/dashboard/kasi/budget",
        icon: Wallet,
      },
      {
        label: "Progress History",
        href: "/dashboard/kasi/history",
        icon: Archive,
      },
      settingsItem,
    ];
  }

  return [
    {
      label: "Overview",
      href: "/dashboard/public",
      icon: Home,
    },
    {
      label: "My Reports",
      href: "/dashboard/public/reports",
      icon: ClipboardList,
    },
    settingsItem,
  ];
}
