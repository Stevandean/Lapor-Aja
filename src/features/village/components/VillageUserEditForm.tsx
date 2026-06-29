"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  toggleVillageUserStatus,
  updateVillageUser,
} from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

type HamletOption = {
  id: string;
  name: string;
};

type SectionOption = {
  id: string;
  name: string;
};

type VillageUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  dusun_id: string | null;
  section_id: string | null;
  is_active: boolean;
};

type VillageUserEditFormProps = {
  user: VillageUser;
  hamlets: HamletOption[];
  sections: SectionOption[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const roleOptions = [
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

export function VillageUserEditForm({
  user,
  hamlets,
  sections,
}: VillageUserEditFormProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateVillageUser,
    initialState
  );

  const [statusState, statusAction, isChangingStatus] = useActionState(
    toggleVillageUserStatus,
    initialState
  );

  useEffect(() => {
    if (!updateState.message) return;

    if (updateState.status === "success") {
      toast.success(updateState.message);
    }

    if (updateState.status === "error") {
      toast.error(updateState.message);
    }
  }, [updateState]);

  useEffect(() => {
    if (!statusState.message) return;

    if (statusState.status === "success") {
      toast.success(statusState.message);
    }

    if (statusState.status === "error") {
      toast.error(statusState.message);
    }
  }, [statusState]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={updateAction} className="rounded-2xl border border-border bg-card p-6">
        <input type="hidden" name="user_id" value={user.id} />

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Edit User Profile
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update user identity, role, and assignment.
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>

            <Input id="email" value={user.email} disabled />

            <p className="mt-2 text-xs text-muted-foreground">
              Email is managed by Supabase Auth and cannot be edited here.
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="full_name">
              Full Name
            </label>

            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="phone_number">
              Phone Number
            </label>

            <Input
              id="phone_number"
              name="phone_number"
              defaultValue={user.phone_number ?? ""}
              placeholder="Example: 081234567890"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="role">
              Role
            </label>

            <select
              id="role"
              name="role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="form-input"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {selectedRole === "kepala_dusun" ? (
            <div>
              <label className="form-label" htmlFor="dusun_id">
                Hamlet Assignment
              </label>

              <select
                id="dusun_id"
                name="dusun_id"
                defaultValue={user.dusun_id ?? ""}
                required
                className="form-input"
              >
                <option value="">Select hamlet</option>

                {hamlets.map((hamlet) => (
                  <option key={hamlet.id} value={hamlet.id}>
                    {hamlet.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Hamlet assignment is required for Kepala Dusun.
              </p>
            </div>
          ) : (
            <input type="hidden" name="dusun_id" value="" />
          )}

          {selectedRole === "kasi" ? (
            <div>
              <label className="form-label" htmlFor="section_id">
                Section Assignment
              </label>

              <select
                id="section_id"
                name="section_id"
                defaultValue={user.section_id ?? ""}
                required
                className="form-input"
              >
                <option value="">Select section</option>

                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Section assignment is required for Kepala Seksi.
              </p>
            </div>
          ) : (
            <input type="hidden" name="section_id" value="" />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Account Status
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Deactivated users cannot access protected dashboard features.
          </p>

          <div className="mt-5 rounded-2xl bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Status
            </p>

            <p className="mt-2 text-lg font-bold text-foreground">
              {user.is_active ? "Active" : "Inactive"}
            </p>
          </div>

          <form action={statusAction} className="mt-5">
            <input type="hidden" name="user_id" value={user.id} />
            <input
              type="hidden"
              name="action"
              value={user.is_active ? "deactivate" : "activate"}
            />

            <Button
              type="submit"
              variant={user.is_active ? "outline" : undefined}
              disabled={isChangingStatus}
              className="w-full"
            >
              {isChangingStatus
                ? "Processing..."
                : user.is_active
                  ? "Deactivate User"
                  : "Activate User"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-5">
          <p className="text-sm font-semibold text-warning-700">
            Security Note
          </p>

          <p className="mt-2 text-sm leading-6 text-warning-700">
            Do not give admin, sekdes, or kepala desa roles to public users
            unless the account is verified as an official staff account.
          </p>
        </div>
      </aside>
    </div>
  );
}
