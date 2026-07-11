"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  toggleVillageUserStatus,
  updateVillageUser,
} from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

type HamletOption = {
  id: string;
  name: string;
};

type SectionOption = {
  id: string;
  name: string;
};

type VillageUser = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  dusun_id: string | null;
  section_id: string | null;
  is_active: boolean;
};

type VillageUserEditFormProps = {
  user: VillageUser;
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

export function VillageUserEditForm({
  user,
  hamlets,
  sections,
}: VillageUserEditFormProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateVillageUser,
    initialState
  );

  const [statusState, statusAction, isChangingStatus] = useActionState(
    toggleVillageUserStatus,
    initialState
  );

  useEffect(() => {
    if (!updateState.message) return;

    if (updateState.status === "success") {
      toast.success(updateState.message);
    }

    if (updateState.status === "error") {
      toast.error(updateState.message);
    }
  }, [updateState]);

  useEffect(() => {
    if (!statusState.message) return;

    if (statusState.status === "success") {
      toast.success(statusState.message);
    }

    if (statusState.status === "error") {
      toast.error(statusState.message);
    }
  }, [statusState]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={updateAction} className="rounded-2xl border border-border bg-card p-6">
        <input type="hidden" name="user_id" value={user.id} />

        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Edit Profil Pengguna
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Perbarui identitas, role, dan penugasan pengguna.
          </p>
        </div>

        <div className="mt-6 grid gap-5">
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>

            <Input id="email" value={user.email} disabled />

            <p className="mt-2 text-xs text-muted-foreground">
              Email dikelola oleh Supabase Auth dan tidak bisa diedit di sini.
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="full_name">
              Nama Lengkap
            </label>

            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="phone_number">
              Nomor HP
            </label>

            <Input
              id="phone_number"
              name="phone_number"
              defaultValue={user.phone_number ?? ""}
              placeholder="Contoh: 081234567890"
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
                Penugasan Dusun
              </label>

              <select
                id="dusun_id"
                name="dusun_id"
                defaultValue={user.dusun_id ?? ""}
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

              <p className="mt-2 text-xs text-muted-foreground">
                Penugasan dusun wajib diisi untuk Kepala Dusun.
              </p>
            </div>
          ) : (
            <input type="hidden" name="dusun_id" value="" />
          )}

          {selectedRole === "kasi" ? (
            <div>
              <label className="form-label" htmlFor="section_id">
                Penugasan Seksi
              </label>

              <select
                id="section_id"
                name="section_id"
                defaultValue={user.section_id ?? ""}
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

              <p className="mt-2 text-xs text-muted-foreground">
                Penugasan seksi wajib diisi untuk Kepala Seksi.
              </p>
            </div>
          ) : (
            <input type="hidden" name="section_id" value="" />
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Status Akun
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pengguna nonaktif tidak dapat mengakses fitur dashboard yang
            dilindungi.
          </p>

          <div className="mt-5 rounded-2xl bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status Saat Ini
            </p>

            <p className="mt-2 text-lg font-bold text-foreground">
              {user.is_active ? "Aktif" : "Nonaktif"}
            </p>
          </div>

          <form action={statusAction} className="mt-5">
            <input type="hidden" name="user_id" value={user.id} />
            <input
              type="hidden"
              name="action"
              value={user.is_active ? "deactivate" : "activate"}
            />

            <Button
              type="submit"
              variant={user.is_active ? "outline" : undefined}
              disabled={isChangingStatus}
              className="w-full"
            >
              {isChangingStatus
                ? "Memproses..."
                : user.is_active
                  ? "Nonaktifkan Pengguna"
                  : "Aktifkan Pengguna"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-5">
          <p className="text-sm font-semibold text-warning-700">
            Catatan Keamanan
          </p>

          <p className="mt-2 text-sm leading-6 text-warning-700">
            Jangan berikan role admin, sekdes, atau kepala desa kepada pengguna
            publik kecuali akun sudah diverifikasi sebagai akun perangkat resmi.
          </p>
        </div>
      </aside>
    </div>
  );
}
