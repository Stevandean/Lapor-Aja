import { requireRole } from "@/src/lib/auth/requireRole";

export default async function VillageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["kepala_desa", "sekdes"]);

  return <>{children}</>;
}