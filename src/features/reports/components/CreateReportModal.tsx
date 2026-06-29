"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  Loader2,
  LocateFixed,
  MapPin,
  MapPinned,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { createReport } from "@/src/features/reports/actions";
import type { ActionState } from "@/src/types/action";

type CreateReportModalProps = {
  buttonLabel?: string;
  buttonVariant?: "default" | "outline";
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function CreateReportModal({
  buttonLabel = "Create Report",
  buttonVariant = "default",
}: CreateReportModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState(false);
  const REPORT_RADIUS_KM = 5;
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);

  const [state, action, isPending] = useActionState(
    createReport,
    initialState
  );

  const ReportLocationMap = dynamic(
    () =>
        import("@/src/features/reports/components/ReportLocationMap").then(
        (module) => module.ReportLocationMap
        ),
    {
        ssr: false,
        loading: () => (
        <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
            <p className="text-sm text-muted-foreground">Loading map picker...</p>
        </div>
        ),
    }
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setGpsLatitude("");
      setGpsLongitude("");
      setLatitude("");
      setLongitude("");
      setSelectedAddress("");
      router.refresh();
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state, router]);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const nextLatitude = String(position.coords.latitude);
            const nextLongitude = String(position.coords.longitude);

            setGpsLatitude(nextLatitude);
            setGpsLongitude(nextLongitude);

            setLatitude(nextLatitude);
            setLongitude(nextLongitude);

            setLocationLoading(false);

            toast.success("GPS location detected", {
                description:
                "You can now drag the marker or click within the allowed radius.",
            });

            getAddressFromCoordinates(nextLatitude, nextLongitude);
        },
        () => {
            setLocationLoading(false);

            toast.error("Failed to get GPS location", {
                description: "Please allow location access and try again.",
            });
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
        }
    );
  }

  function handleLocationChange(nextLatitude: string, nextLongitude: string) {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    getAddressFromCoordinates(nextLatitude, nextLongitude);
  }

  async function getAddressFromCoordinates(
    nextLatitude: string,
    nextLongitude: string
  ) {
    setAddressLoading(true);

    try {
        const params = new URLSearchParams({
        format: "jsonv2",
        lat: nextLatitude,
        lon: nextLongitude,
        zoom: "18",
        addressdetails: "1",
        });

        const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
            headers: {
            Accept: "application/json",
            },
        }
        );

        if (!response.ok) {
        throw new Error("Failed to fetch address.");
        }

        const data = await response.json();

        setSelectedAddress(
        data.display_name || "Selected location address is unavailable."
        );
    } catch {
        setSelectedAddress("Address unavailable. Coordinates have been saved.");

        toast.error("Failed to read address", {
        description:
            "The location is still saved, but the address could not be generated.",
        });
    } finally {
        setAddressLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant === "outline" ? "outline" : undefined}
        onClick={() => setOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Create Report"
        description="Submit a public report with description, location, and photo evidence."
        className="max-w-3xl"
      >
        <form ref={formRef} action={action} className="space-y-5">
            <input type="hidden" name="latitude" value={latitude} />
            <input type="hidden" name="longitude" value={longitude} />
            <input type="hidden" name="gps_latitude" value={gpsLatitude} />
            <input type="hidden" name="gps_longitude" value={gpsLongitude} />
            <input type="hidden" name="location_radius_km" value={REPORT_RADIUS_KM} />
            <input type="hidden" name="auto_address" value={selectedAddress} />

          <div>
            <label className="form-label" htmlFor="title">
              Report Title
            </label>

            <Input
              id="title"
              name="title"
              placeholder="Example: Damaged road near the village hall"
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
              placeholder="Explain the problem clearly so the village staff can understand the report."
              rows={5}
              required
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-muted/30 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <MapPinned className="h-5 w-5" />
                        </div>

                        <div>
                        <p className="text-sm font-semibold text-foreground">
                            Report Location
                        </p>

                        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                            Start by detecting your GPS location. After that, you can adjust the
                            report point by dragging the marker or clicking the map within{" "}
                            {REPORT_RADIUS_KM} km from your GPS position.
                        </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locationLoading}
                        className="w-full gap-2 sm:w-auto"
                    >
                        {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                        <LocateFixed className="h-4 w-4" />
                        )}
                        {locationLoading ? "Detecting GPS..." : "Use GPS Location"}
                    </Button>
                </div>
            </div>

            <div className="p-5">
                {gpsLatitude && gpsLongitude ? (
                <div className="space-y-4">
                    <ReportLocationMap
                    gpsLatitude={gpsLatitude}
                    gpsLongitude={gpsLongitude}
                    selectedLatitude={latitude}
                    selectedLongitude={longitude}
                    radiusKm={REPORT_RADIUS_KM}
                    onLocationChange={handleLocationChange}
                    />

                    <div className="">
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                                <MapPin className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                Selected Address
                                </p>

                                {addressLoading ? (
                                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Reading address...
                                </div>
                                ) : (
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {selectedAddress || "Address will appear after location is selected."}
                                </p>
                                )}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
                ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-50 text-warning-700">
                    <LocateFixed className="h-6 w-6" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-foreground">
                    GPS location is required
                    </p>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Click the GPS button first. The map picker will appear after your
                    location is detected.
                    </p>
                </div>
                )}
            </div>
            </div>

          <div>
            <label className="form-label" htmlFor="photos">
              Evidence Photos
            </label>

            <Input
              id="photos"
              name="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Upload 1–5 photos. Allowed formats: JPG, PNG, or WEBP. Maximum
              size: 10MB per photo.
            </p>
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

            <Button
                type="submit"
                    disabled={isPending || !gpsLatitude || !gpsLongitude || !latitude || !longitude}
                >
                {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}