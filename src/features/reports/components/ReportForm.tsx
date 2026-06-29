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
      toast.error("Location is not supported", {
        description: "Your browser does not support geolocation.",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setIsLocating(false);

        toast.success("Location captured", {
          description: "Your current location has been added to the report.",
        });
      },
      () => {
        setIsLocating(false);

        toast.error("Failed to get location", {
          description: "Please allow location access in your browser.",
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
        label="Report title"
        name="title"
        placeholder="Example: Damaged road near the village hall"
        required
      />

      <Textarea
        label="Report description"
        name="description"
        placeholder="Describe the issue clearly, including the condition and impact."
        helperText="Write a clear description so village officers can review the report properly."
        required
      />

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Report location
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use your current location so the village officer can identify
              where the issue happened.
            </p>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                isLoading={isLocating}
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                Use current location
              </Button>
            </div>

            {latitude && longitude ? (
              <div className="mt-4 rounded-xl border border-success-100 bg-success-50 p-3 text-sm text-success-700">
                Location selected: {Number(latitude).toFixed(6)},{" "}
                {Number(longitude).toFixed(6)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-warning-100 bg-warning-50 p-3 text-sm text-warning-700">
                Location has not been selected yet.
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
        <label className="form-label">Photo evidence</label>

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
                Upload 1–5 photos. Supported formats: JPG, PNG, WEBP. Maximum
                10MB per photo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          disabled={isPending || !latitude || !longitude}
        >
          {isPending ? "Submitting..." : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
