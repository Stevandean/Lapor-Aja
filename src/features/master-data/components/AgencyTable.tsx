"use client";

import { useActionState, useEffect, useState } from "react";
import {
  CircleCheck,
  CircleX,
  Mail,
  Pencil,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  toggleAgencyStatus,
  updateAgency,
} from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

type Agency = {
  id: string;
  name: string;
  description: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AgencyTableProps = {
  agencies: Agency[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AgencyTable({ agencies }: AgencyTableProps) {
  if (agencies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          No agencies found
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the first agency to support forwarding reports outside village
          authority.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Agency</th>
              <th className="px-5 py-4 font-semibold">Contact</th>
              <th className="px-5 py-4 font-semibold">Address</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Updated</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {agencies.map((agency) => (
              <tr
                key={agency.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">
                    {agency.name}
                  </p>

                  <p className="mt-1 line-clamp-2 max-w-xs text-sm text-muted-foreground">
                    {agency.description || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {agency.contact_person || "-"}
                    </p>

                    {agency.phone ? (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        {agency.phone}
                      </p>
                    ) : null}

                    {agency.email ? (
                      <p className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {agency.email}
                      </p>
                    ) : null}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="line-clamp-2 max-w-xs text-muted-foreground">
                    {agency.address || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge isActive={agency.is_active} />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(agency.updated_at)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <AgencyEditModal agency={agency} />
                    <AgencyStatusButton agency={agency} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border xl:hidden">
        {agencies.map((agency) => (
          <div key={agency.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{agency.name}</p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {agency.description || "-"}
                </p>
              </div>

              <StatusBadge isActive={agency.is_active} />
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {agency.contact_person || "No contact person"}
              </p>

              {agency.phone ? <p className="mt-1">{agency.phone}</p> : null}
              {agency.email ? <p className="mt-1">{agency.email}</p> : null}
              {agency.address ? <p className="mt-1">{agency.address}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <AgencyEditModal agency={agency} />
              <AgencyStatusButton agency={agency} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencyEditModal({ agency }: { agency: Agency }) {
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    updateAgency,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      setOpen(false);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Edit Agency"
        description="Update agency information."
        className="max-w-2xl"
      >
        <form action={action} className="space-y-5">
          <input type="hidden" name="agency_id" value={agency.id} />

          <div>
            <label className="form-label" htmlFor={`agency-name-${agency.id}`}>
              Agency Name
            </label>

            <Input
              id={`agency-name-${agency.id}`}
              name="name"
              defaultValue={agency.name}
              required
            />
          </div>

          <div>
            <label
              className="form-label"
              htmlFor={`agency-description-${agency.id}`}
            >
              Description
            </label>

            <Textarea
              id={`agency-description-${agency.id}`}
              name="description"
              defaultValue={agency.description ?? ""}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="form-label"
                htmlFor={`contact-person-${agency.id}`}
              >
                Contact Person
              </label>

              <Input
                id={`contact-person-${agency.id}`}
                name="contact_person"
                defaultValue={agency.contact_person ?? ""}
              />
            </div>

            <div>
              <label className="form-label" htmlFor={`phone-${agency.id}`}>
                Phone
              </label>

              <Input
                id={`phone-${agency.id}`}
                name="phone"
                defaultValue={agency.phone ?? ""}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor={`email-${agency.id}`}>
              Email
            </label>

            <Input
              id={`email-${agency.id}`}
              name="email"
              type="email"
              defaultValue={agency.email ?? ""}
            />
          </div>

          <div>
            <label className="form-label" htmlFor={`address-${agency.id}`}>
              Address
            </label>

            <Textarea
              id={`address-${agency.id}`}
              name="address"
              defaultValue={agency.address ?? ""}
              rows={3}
            />
          </div>

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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function AgencyStatusButton({ agency }: { agency: Agency }) {
  const [state, action, isPending] = useActionState(
    toggleAgencyStatus,
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
    <form action={action}>
      <input type="hidden" name="agency_id" value={agency.id} />
      <input
        type="hidden"
        name="action"
        value={agency.is_active ? "deactivate" : "activate"}
      />

      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {agency.is_active ? "Deactivate" : "Activate"}
      </Button>
    </form>
  );
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}