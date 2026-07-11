"use client";

import { useActionState, useEffect, useState } from "react";
import { Camera, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createReport } from "@/src/features/reports/actions";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function ReportForm() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [state, action, isPending] = useActionState(
    createReport,
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

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Lokasi tidak didukung", {
        description: "Browser Anda tidak mendukung geolokasi.",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setIsLocating(false);

        toast.success("Lokasi berhasil diambil", {
          description: "Lokasi Anda sudah ditambahkan ke laporan.",
        });
      },
      () => {
        setIsLocating(false);

        toast.error("Gagal mengambil lokasi", {
          description: "Izinkan akses lokasi di browser, lalu coba lagi.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <form action={action} className="space-y-6">
      <Input
        label="Judul laporan"
        name="title"
        placeholder="Contoh: Jalan rusak di dekat balai desa"
        required
      />

      <Textarea
        label="Deskripsi laporan"
        name="description"
        placeholder="Jelaskan masalah dengan jelas, termasuk kondisi dan dampaknya."
        helperText="Tulis deskripsi yang jelas agar petugas desa dapat meninjau laporan dengan tepat."
        required
      />

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Lokasi laporan
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Gunakan lokasi Anda saat ini agar petugas desa dapat mengetahui
              tempat masalah terjadi.
            </p>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                isLoading={isLocating}
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                Gunakan lokasi saat ini
              </Button>
            </div>

            {latitude && longitude ? (
              <div className="mt-4 rounded-xl border border-success-100 bg-success-50 p-3 text-sm text-success-700">
                Lokasi dipilih: {Number(latitude).toFixed(6)},{" "}
                {Number(longitude).toFixed(6)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-warning-100 bg-warning-50 p-3 text-sm text-warning-700">
                Lokasi belum dipilih.
              </div>
            )}
          </div>
        </div>
      </div>

      <input type="hidden" name="latitude" value={latitude} />
      <input type="hidden" name="longitude" value={longitude} />
      <input type="hidden" name="gps_latitude" value={latitude} />
      <input type="hidden" name="gps_longitude" value={longitude} />
      <input type="hidden" name="location_radius_km" value="5" />
      <input type="hidden" name="auto_address" value="" />

      <div className="space-y-2">
        <label className="form-label">Foto bukti</label>

        <div className="rounded-2xl border border-dashed border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <Camera className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <input
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp"
                multiple
                required
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary-700"
              />

              <p className="mt-2 text-sm text-muted-foreground">
                Unggah 1-5 foto. Format yang didukung: JPG, PNG, WEBP.
                Maksimal 10MB per foto.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={isPending || !latitude || !longitude}>
          {isPending ? "Mengirim..." : "Kirim laporan"}
        </Button>
      </div>
    </form>
  );
}
