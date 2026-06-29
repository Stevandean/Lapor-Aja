"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createCategory } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function CategoryCreateModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    createCategory,
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
        Add Category
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Category"
        description="Create a report category used for classifying citizen reports."
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="name">
              Category Name
            </label>

            <Input
              id="name"
              name="name"
              placeholder="Example: Road Damage"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="description">
              Description
            </label>

            <Textarea
              id="description"
              name="description"
              placeholder="Briefly describe what this category is used for."
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}