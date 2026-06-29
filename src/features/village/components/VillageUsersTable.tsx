"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CircleCheck,
  CircleX,
  Filter,
  Pencil,
  Search,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

type RelationName = {
  id?: string;
  name: string;
};

type VillageUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  dusun: RelationName[] | RelationName | null;
  section: RelationName[] | RelationName | null;
};

type VillageUsersTableProps = {
  users: VillageUser[];
};

const roleFilters = [
  {
    label: "All Roles",
    value: "all",
  },
  {
    label: "Public",
    value: "public",
  },
  {
    label: "Admin",
    value: "admin",
  },
  {
    label: "Kepala Desa",
    value: "kepala_desa",
  },
  {
    label: "Sekdes",
    value: "sekdes",
  },
  {
    label: "Kepala Dusun",
    value: "kepala_dusun",
  },
  {
    label: "Kepala Seksi",
    value: "kasi",
  },
];

const statusFilters = [
  {
    label: "All Status",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive",
    value: "inactive",
  },
];

export function VillageUsersTable({ users }: VillageUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone_number?.toLowerCase().includes(query);

      const matchesRole =
        selectedRole === "all" || user.role === selectedRole;

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && user.is_active) ||
        (selectedStatus === "inactive" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    selectedRole !== "all" ||
    selectedStatus !== "all";

  function resetFilters() {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
  }

  if (users.length === 0) {
    return <EmptyUsersState />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <label className="form-label" htmlFor="user-search">
                Search User
              </label>

              <div className="relative">
                <Input
                  id="user-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="pl-10"
                />

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="role-filter">
                Role
              </label>

              <select
                id="role-filter"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="form-input"
              >
                {roleFilters.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="status-filter">
                Status
              </label>

              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="form-input"
              >
                {statusFilters.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                Showing{" "}
                <strong className="font-semibold text-foreground">
                  {filteredUsers.length}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-foreground">
                  {users.length}
                </strong>
              </span>
            </div>

            {hasActiveFilter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <NoFilteredUsersState onReset={resetFilters} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Phone</th>
                  <th className="px-5 py-4 font-semibold">Assignment</th>
                  <th className="px-5 py-4 font-semibold">Registered</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {user.full_name || "-"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge isActive={user.is_active} />
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {user.phone_number ?? "-"}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {getUserAssignment(user)}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <ManageLink userId={user.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {user.full_name || "-"}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <StatusBadge isActive={user.is_active} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <RoleBadge role={user.role} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoItem label="Phone" value={user.phone_number ?? "-"} />
                  <InfoItem
                    label="Assignment"
                    value={getUserAssignment(user)}
                  />
                  <InfoItem
                    label="Registered"
                    value={formatDate(user.created_at)}
                  />
                </div>

                <div className="mt-4">
                  <ManageLink userId={user.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyUsersState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <Users className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">
        No users found
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        User data will appear here after accounts are registered or created.
      </p>
    </div>
  );
}

function NoFilteredUsersState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-50 text-warning-700">
        <Search className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">
        No matching users
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Try changing the search keyword, role filter, or status filter.
      </p>

      <Button type="button" variant="outline" onClick={onReset} className="mt-5">
        Reset Filters
      </Button>
    </div>
  );
}

function ManageLink({ userId }: { userId: string }) {
  return (
    <Link
      href={`/dashboard/village/users/${userId}`}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
    >
      <Pencil className="h-3.5 w-3.5" />
      Manage
    </Link>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return <Badge className="bg-info-50 text-info-700">Admin</Badge>;
  }

  if (role === "kepala_dusun") {
    return (
      <Badge className="bg-warning-50 text-warning-700">Kepala Dusun</Badge>
    );
  }

  if (role === "kepala_desa") {
    return (
      <Badge className="bg-primary-50 text-primary-700">Kepala Desa</Badge>
    );
  }

  if (role === "sekdes") {
    return <Badge className="bg-success-50 text-success-700">Sekdes</Badge>;
  }

  if (role === "kasi") {
    return (
      <Badge className="bg-purple-50 text-purple-700">Kepala Seksi</Badge>
    );
  }

  return <Badge variant="muted">Public</Badge>;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-success-50 text-success-700">
        <CircleCheck className="mr-1 h-3.5 w-3.5" />
        Active
      </Badge>
    );
  }

  return (
    <Badge className="bg-danger-50 text-danger-700">
      <CircleX className="mr-1 h-3.5 w-3.5" />
      Inactive
    </Badge>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getUserAssignment(user: VillageUser) {
  if (user.role === "kepala_dusun") {
    return getRelationName(user.dusun);
  }

  if (user.role === "kasi") {
    return getRelationName(user.section);
  }

  return "-";
}
