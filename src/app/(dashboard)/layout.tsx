import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { getNavbarNotifications } from "@/src/features/notifications/queries";
import { getProfile } from "@/src/lib/auth/getProfile";
import { redirect } from "next/navigation";
import { ROUTES } from "@/src/lib/constants/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const notifications = await getNavbarNotifications(profile.id);

  return (
    <DashboardShell profile={profile} notifications={notifications}>
      {children}
    </DashboardShell>
  );
}
