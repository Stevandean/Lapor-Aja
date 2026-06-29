import { requireRole } from "@/src/lib/auth/requireRole";

export default async function HamletHeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["kepala_dusun"]);

  return <>{children}</>;
}