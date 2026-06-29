"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createVillageSection } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function VillageSectionCreateModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    createVillageSection,
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
        Add Section
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Village Section"
        description="Create an internal village section used for assigning village-handled reports to Kasi."
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="name">
              Section Name
            </label>

            <Input
              id="name"
              name="name"
              placeholder="Example: Kasi Pelayanan"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="code">
              Code
            </label>

            <Input
              id="code"
              name="code"
              placeholder="Example: KASI_PELAYANAN"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="description">
              Description
            </label>

            <Textarea
              id="description"
              name="description"
              placeholder="Briefly describe the responsibility of this section."
              rows={4}
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
              {isPending ? "Creating..." : "Create Section"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}