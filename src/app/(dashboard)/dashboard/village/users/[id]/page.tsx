import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/src/components/ui/Badge";
import { VillageUserEditForm } from "@/src/features/village/components/VillageUserEditForm";
import {
  getVillageSectionOptions,
  getVillageUserDetail,
  getVillageUserFormOptions,
} from "@/src/features/village/queries";

type VillageUserEditFormUser = ComponentProps<typeof VillageUserEditForm>["user"];

type VillageUserDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VillageUserDetailPage({
  params,
}: VillageUserDetailPageProps) {
  const { id } = await params;

  const [user, options, sections] = await Promise.all([
    getVillageUserDetail(id),
    getVillageUserFormOptions(),
    getVillageSectionOptions(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke pengguna
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold text-primary">
              Manajemen Pengguna
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {user.full_name || "Pengguna tanpa nama"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Kelola profil, role, penugasan, dan status akun pengguna.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">{formatRole(user.role)}</Badge>

            {user.is_active ? (
              <Badge className="bg-success-50 text-success-700">Aktif</Badge>
            ) : (
              <Badge className="bg-danger-50 text-danger-700">Nonaktif</Badge>
            )}

            <Badge className="bg-primary-50 text-primary-700">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              Akun Terkelola
            </Badge>
          </div>
        </div>
      </section>

      <VillageUserEditForm
        user={user as VillageUserEditFormUser}
        hamlets={options.hamlets}
        sections={sections}
      />
    </div>
  );
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    public: "Publik",
    admin: "Admin",
    kepala_desa: "Kepala Desa",
    sekdes: "Sekdes",
    kepala_dusun: "Kepala Dusun",
    kasi: "Kepala Seksi",
  };

  return labels[role] ?? role;
}
