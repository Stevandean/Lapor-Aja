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
    label: "Publik",
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
        Buat Pengguna
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Buat Pengguna"
        description="Buat akun masyarakat atau perangkat desa dengan penugasan peran yang aman."
      >
        <form action={action} className="space-y-5">
          <div>
            <label className="form-label" htmlFor="full_name">
              Nama Lengkap
            </label>

            <Input
              id="full_name"
              name="full_name"
              placeholder="Contoh: Ahmad Fauzi"
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
              Kata Sandi Sementara
            </label>

            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimal 6 karakter"
              required
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Berikan kata sandi sementara ini kepada pengguna. Pengguna dapat
              menggantinya nanti jika fitur reset kata sandi sudah ditambahkan.
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="phone_number">
              Nomor HP
            </label>

            <Input
              id="phone_number"
              name="phone_number"
              placeholder="Contoh: 081234567890"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="role">
              Peran
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
                Penugasan Dusun
              </label>

              <select
                id="dusun_id"
                name="dusun_id"
                required
                className="form-input"
              >
                <option value="">Pilih dusun</option>

                {hamlets.map((hamlet) => (
                  <option key={hamlet.id} value={hamlet.id}>
                    {hamlet.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Penugasan dusun wajib diisi untuk Kepala Dusun.
              </p>
            </div>
          ) : null}

          {selectedRole === "kasi" ? (
            <div>
              <label className="form-label" htmlFor="section_id">
                Penugasan Seksi
              </label>

              <select
                id="section_id"
                name="section_id"
                required
                className="form-input"
              >
                <option value="">Pilih seksi</option>

                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Penugasan seksi wajib diisi untuk Kepala Seksi.
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
              Batal
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Membuat..." : "Buat Pengguna"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
