"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createDusun } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function DusunCreateModal() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(createDusun, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setTimeout(() => setOpen(false), 0);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Dusun
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tambah Dusun"
        description="Buat wilayah dusun untuk penugasan laporan dan akses kepala dusun."
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="dusun-name">
              Nama Dusun
            </label>

            <Input
              id="dusun-name"
              name="name"
              placeholder="Contoh: Dusun Krajan"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="dusun-description">
              Deskripsi
            </label>

            <Textarea
              id="dusun-description"
              name="description"
              placeholder="Jelaskan singkat wilayah dusun ini."
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
              Batal
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Membuat..." : "Buat Dusun"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
