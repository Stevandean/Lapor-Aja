import {
  Landmark,
  MapPinned,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { ComponentProps } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { VillageUsersTable } from "@/src/features/village/components/VillageUsersTable";
import {
  getVillageSectionOptions,
  getVillageUserFormOptions,
  getVillageUsersData,
} from "@/src/features/village/queries";
import { VillageUserCreateModal } from "@/src/features/village/components/VillageUserCreateModal";

type VillageUsersTableUsers = ComponentProps<typeof VillageUsersTable>["users"];

export default async function VillageUsersPage() {
  const [{ users, stats }, options, sections] = await Promise.all([
    getVillageUsersData(),
    getVillageUserFormOptions(),
    getVillageSectionOptions(),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Pengguna</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Manajemen Pengguna
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola akun masyarakat dan perangkat desa, termasuk role,
            penugasan dusun, penugasan seksi, dan status akun.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <VillageUserCreateModal
            hamlets={options.hamlets}
            sections={sections}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <VillageStatCard
          title="Total Pengguna"
          value={stats.totalUsers}
          description="Semua akun terdaftar."
          icon={<Users className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Pengguna Publik"
          value={stats.publicUsers}
          description="Akun masyarakat."
          icon={<UserCheck className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Admin"
          value={stats.adminUsers}
          description="Akun operator admin."
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Kepala Dusun"
          value={stats.hamletHeadUsers}
          description="Akun kepala dusun."
          icon={<MapPinned className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Pimpinan Desa"
          value={stats.villageLeaders}
          description="Kepala desa dan sekdes."
          icon={<Landmark className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-border sm:flex-row sm:items-center">
          <div>
            <CardTitle>Daftar Pengguna</CardTitle>

            <CardDescription>
              Menampilkan pengguna terdaftar dan role mereka di sistem
              pelaporan. Gunakan aksi kelola untuk memperbarui profil dan
              status akses pengguna.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <VillageUsersTable users={users as VillageUsersTableUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
