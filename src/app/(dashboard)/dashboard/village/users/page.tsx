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
          <p className="text-sm font-semibold text-primary">Users</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            User Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage registered citizens and village staff accounts, including
            roles, hamlet assignments, section assignments, and account status.
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
          title="Total Users"
          value={stats.totalUsers}
          description="All registered accounts."
          icon={<Users className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Public Users"
          value={stats.publicUsers}
          description="Citizen accounts."
          icon={<UserCheck className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Admin"
          value={stats.adminUsers}
          description="Admin operator accounts."
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Hamlet Heads"
          value={stats.hamletHeadUsers}
          description="Kepala dusun accounts."
          icon={<MapPinned className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Village Leaders"
          value={stats.villageLeaders}
          description="Kepala desa and sekdes."
          icon={<Landmark className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-border sm:flex-row sm:items-center">
          <div>
            <CardTitle>User List</CardTitle>

            <CardDescription>
              Showing registered users and their roles in the reporting system.
              Use the manage action to update user profile and access status.
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
