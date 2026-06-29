import type { UserRole } from "@/src/types/profile";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",

  DASHBOARD: "/dashboard",

  REPORT_CREATE: "/reports/create",

  ADMIN_DASHBOARD: "/dashboard/admin",
  HAMLET_HEAD_DASHBOARD: "/dashboard/hamlet-head",
  VILLAGE_DASHBOARD: "/dashboard/village",
  PUBLIC_DASHBOARD: "/dashboard/public",
  KASI_DASHBOARD: "/dashboard/kasi"
} as const;

export function getDashboardRouteByRole(role: UserRole | null | undefined) {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN_DASHBOARD;

    case "kepala_dusun":
      return ROUTES.HAMLET_HEAD_DASHBOARD;

    case "kepala_desa":
    case "sekdes":
      return ROUTES.VILLAGE_DASHBOARD;
    
    case "kasi":
      return ROUTES.KASI_DASHBOARD;

    case "public":
      return ROUTES.PUBLIC_DASHBOARD;

    default:
      return ROUTES.LOGIN;
  }
}