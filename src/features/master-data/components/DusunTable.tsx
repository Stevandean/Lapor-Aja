"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheck, CircleX, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  toggleDusunStatus,
  updateDusun,
} from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

type Dusun = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DusunTableProps = {
  dusuns: Dusun[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function DusunTable({ dusuns }: DusunTableProps) {
  if (dusuns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          Belum ada dusun
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Tambahkan dusun pertama untuk mendukung penugasan laporan berdasarkan
          wilayah.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Dusun</th>
              <th className="px-5 py-4 font-semibold">Deskripsi</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Diperbarui</th>
              <th className="px-5 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {dusuns.map((dusun) => (
              <tr key={dusun.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">{dusun.name}</p>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {dusun.description || "-"}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge isActive={dusun.is_active} />
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(dusun.updated_at)}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <DusunEditModal dusun={dusun} />
                    <DusunStatusButton dusun={dusun} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {dusuns.map((dusun) => (
          <div key={dusun.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{dusun.name}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {dusun.description || "-"}
                </p>
              </div>

              <StatusBadge isActive={dusun.is_active} />
            </div>

            <div className="mt-4 flex gap-2">
              <DusunEditModal dusun={dusun} />
              <DusunStatusButton dusun={dusun} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DusunEditModal({ dusun }: { dusun: Dusun }) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(updateDusun, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      setTimeout(() => setOpen(false), 0);
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
        Ubah
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Ubah Dusun"
        description="Perbarui informasi dusun."
      >
        <form action={action} className="space-y-5">
          <input type="hidden" name="dusun_id" value={dusun.id} />

          <div>
            <label className="form-label" htmlFor={`dusun-name-${dusun.id}`}>
              Nama Dusun
            </label>

            <Input
              id={`dusun-name-${dusun.id}`}
              name="name"
              defaultValue={dusun.name}
              required
            />
          </div>

          <div>
            <label
              className="form-label"
              htmlFor={`dusun-description-${dusun.id}`}
            >
              Deskripsi
            </label>

            <Textarea
              id={`dusun-description-${dusun.id}`}
              name="description"
              defaultValue={dusun.description ?? ""}
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
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function DusunStatusButton({ dusun }: { dusun: Dusun }) {
  const [state, action, isPending] = useActionState(
    toggleDusunStatus,
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
      <input type="hidden" name="dusun_id" value={dusun.id} />
      <input
        type="hidden"
        name="action"
        value={dusun.is_active ? "deactivate" : "activate"}
      />

      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {dusun.is_active ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </form>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-success-50 text-success-700">
        <CircleCheck className="mr-1 h-3.5 w-3.5" />
        Aktif
      </Badge>
    );
  }

  return (
    <Badge className="bg-danger-50 text-danger-700">
      <CircleX className="mr-1 h-3.5 w-3.5" />
      Nonaktif
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
