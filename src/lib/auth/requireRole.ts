import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import type { UserRole } from "@/src/types/profile";

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}