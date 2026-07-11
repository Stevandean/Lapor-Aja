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
      setTimeout(() => setOpen(false), 0);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Seksi
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Tambah Seksi Desa"
        description="Buat seksi internal desa untuk menugaskan laporan yang ditangani desa kepada Kasi."
      >
        <form ref={formRef} action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="name">
              Nama Seksi
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
              Kode
            </label>

            <Input
              id="code"
              name="code"
              placeholder="Example: KASI_PELAYANAN"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="description">
              Deskripsi
            </label>

            <Textarea
              id="description"
              name="description"
              placeholder="Jelaskan singkat tanggung jawab seksi ini."
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
              {isPending ? "Membuat..." : "Buat Seksi"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
