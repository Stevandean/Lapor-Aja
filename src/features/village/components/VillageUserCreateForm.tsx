"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { createVillageUser } from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

type HamletOption = {
  id: string;
  name: string;
};

type VillageUserCreateFormProps = {
  hamlets: HamletOption[];
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
];

export function VillageUserCreateForm({ hamlets }: VillageUserCreateFormProps) {
  const [selectedRole, setSelectedRole] = useState("public");

  const [state, action, isPending] = useActionState(
    createVillageUser,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={action} className="rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Create User Account
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Create an internal or public account and assign the correct role.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="form-label" htmlFor="full_name">
            Full Name
          </label>

          <Input
            id="full_name"
            name="full_name"
            placeholder="Example: Ahmad Fauzi"
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="email">
            Email
          </label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="password">
            Temporary Password
          </label>

          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            required
          />

          <p className="mt-2 text-xs text-muted-foreground">
            Give this temporary password to the user. They can change it later
            if password reset is added.
          </p>
        </div>

        <div>
          <label className="form-label" htmlFor="phone_number">
            Phone Number
          </label>

          <Input
            id="phone_number"
            name="phone_number"
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

        <div>
          <label className="form-label" htmlFor="dusun_id">
            Hamlet Assignment
          </label>

          <select
            id="dusun_id"
            name="dusun_id"
            disabled={selectedRole !== "kepala_dusun"}
            className="form-input disabled:cursor-not-allowed disabled:bg-muted"
          >
            <option value="">Select hamlet</option>

            {hamlets.map((hamlet) => (
              <option key={hamlet.id} value={hamlet.id}>
                {hamlet.name}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-muted-foreground">
            Hamlet assignment is required only for Kepala Dusun.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
}