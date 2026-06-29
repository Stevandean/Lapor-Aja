import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  redirect(getDashboardRouteByRole(profile.role));
}