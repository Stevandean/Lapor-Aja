"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createAgency } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AgencyCreateModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    createAgency,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setOpen(false);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Agency
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Agency"
        description="Create an external agency used when reports need to be forwarded outside village authority."
        className="max-w-2xl"
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="agency-name">
              Agency Name
            </label>

            <Input
              id="agency-name"
              name="name"
              placeholder="Example: Dinas Pekerjaan Umum"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="agency-description">
              Description
            </label>

            <Textarea
              id="agency-description"
              name="description"
              placeholder="Briefly describe the agency responsibility."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="contact-person">
                Contact Person
              </label>

              <Input
                id="contact-person"
                name="contact_person"
                placeholder="Example: Bapak Andi"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="phone">
                Phone
              </label>

              <Input
                id="phone"
                name="phone"
                placeholder="Example: 081234567890"
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Example: agency@example.go.id"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="address">
              Address
            </label>

            <Textarea
              id="address"
              name="address"
              placeholder="Agency office address."
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
              {isPending ? "Creating..." : "Create Agency"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}