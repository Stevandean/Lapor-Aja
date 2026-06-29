"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { createVillageUser } from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

type HamletOption = {
  id: string;
  name: string;
};

type SectionOption = {
  id: string;
  name: string;
};

type VillageUserCreateModalProps = {
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

export function VillageUserCreateModal({
  hamlets,
  sections,
}: VillageUserCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("public");

  const [state, action, isPending] = useActionState(
    createVillageUser,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      const timeout = window.setTimeout(() => {
        setOpen(false);
        setSelectedRole("public");
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Create User
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Create User"
        description="Create a new citizen or village staff account with secure role assignment."
      >
        <form action={action} className="space-y-5">
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

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Give this temporary password to the user. The user can change it
              later if password reset is added.
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

          {selectedRole === "kepala_dusun" ? (
            <div>
              <label className="form-label" htmlFor="dusun_id">
                Hamlet Assignment
              </label>

              <select
                id="dusun_id"
                name="dusun_id"
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

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Hamlet assignment is required for Kepala Dusun.
              </p>
            </div>
          ) : null}

          {selectedRole === "kasi" ? (
            <div>
              <label className="form-label" htmlFor="section_id">
                Section Assignment
              </label>

              <select
                id="section_id"
                name="section_id"
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

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Section assignment is required for Kepala Seksi.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
