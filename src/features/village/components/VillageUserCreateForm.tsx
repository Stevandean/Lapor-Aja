"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { createVillageUser } from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

type HamletOption = {
  id: string;
  name: string;
};

type VillageUserCreateFormProps = {
  hamlets: HamletOption[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const roleOptions = [
  {
    label: "Masyarakat",
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
];

export function VillageUserCreateForm({ hamlets }: VillageUserCreateFormProps) {
  const [selectedRole, setSelectedRole] = useState("public");

  const [state, action, isPending] = useActionState(
    createVillageUser,
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
    <form action={action} className="rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Buat Akun Pengguna
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Buat akun internal atau masyarakat dan tetapkan peran yang sesuai.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
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

          <p className="mt-2 text-xs text-muted-foreground">
            Berikan kata sandi sementara ini kepada pengguna. Pengguna dapat
            menggantinya nanti jika fitur reset kata sandi sudah tersedia.
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

        <div>
          <label className="form-label" htmlFor="dusun_id">
            Penugasan Dusun
          </label>

          <select
            id="dusun_id"
            name="dusun_id"
            disabled={selectedRole !== "kepala_dusun"}
            className="form-input disabled:cursor-not-allowed disabled:bg-muted"
          >
            <option value="">Pilih dusun</option>

            {hamlets.map((hamlet) => (
              <option key={hamlet.id} value={hamlet.id}>
                {hamlet.name}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-muted-foreground">
            Penugasan dusun hanya wajib untuk peran Kepala Dusun.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Membuat..." : "Buat Pengguna"}
        </Button>
      </div>
    </form>
  );
}
