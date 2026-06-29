"use client";

import Image from "next/image";
import { useActionState, useEffect } from "react";
import { Bell, Camera, KeyRound, Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import {
  updateNotificationPreferences,
  updateOwnPassword,
  updateOwnProfile,
} from "@/src/features/settings/actions";
import { ROLE_LABELS } from "@/src/lib/constants/roles";
import type { ActionState } from "@/src/types/action";
import type { UserRole } from "@/src/types/profile";

type RelationName = {
  name?: string | null;
};

type SettingsProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  avatar_signed_url: string | null;
  notification_internal_enabled?: boolean;
  notification_email_enabled?: boolean;
  notification_whatsapp_enabled?: boolean;
  notification_settings_available?: boolean;
  dusun?: RelationName[] | RelationName | null;
  section?: RelationName[] | RelationName | null;
};

type SettingsFormsProps = {
  profile: SettingsProfile;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function SettingsForms({ profile }: SettingsFormsProps) {
  const notificationSettingsAvailable =
    profile.notification_settings_available ?? true;
  const [profileState, profileAction, isProfilePending] = useActionState(
    updateOwnProfile,
    initialState
  );
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    updateOwnPassword,
    initialState
  );
  const [notificationState, notificationAction, isNotificationPending] =
    useActionState(updateNotificationPreferences, initialState);

  useActionToast(profileState);
  useActionToast(passwordState);
  useActionToast(notificationState);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your display name, phone number, and profile photo.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={profileAction} className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <AvatarPreview profile={profile} />

                <div className="flex-1">
                  <label className="form-label" htmlFor="avatar">
                    Profile photo
                  </label>
                  <input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-input"
                    disabled={isProfilePending}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    JPG, PNG, or WEBP. Maximum 2MB.
                  </p>
                </div>
              </div>

              <Input
                label="Full name"
                name="full_name"
                defaultValue={profile.full_name}
                required
                disabled={isProfilePending}
              />

              <Input
                label="Phone number"
                name="phone_number"
                defaultValue={profile.phone_number ?? ""}
                placeholder="08xxxxxxxxxx"
                disabled={isProfilePending}
                helperText="This number is used for WhatsApp notifications when enabled."
              />

              <Input
                label="Email"
                value={profile.email}
                disabled
                helperText="Email is managed by your login account and is read-only here."
              />

              <Button type="submit" disabled={isProfilePending}>
                <Save className="mr-2 h-4 w-4" />
                {isProfilePending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Change your password for the current login account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={passwordAction} className="space-y-5">
              <Input
                label="New password"
                name="password"
                type="password"
                minLength={8}
                required
                disabled={isPasswordPending}
              />

              <Input
                label="Confirm new password"
                name="confirm_password"
                type="password"
                minLength={8}
                required
                disabled={isPasswordPending}
              />

              <Button type="submit" disabled={isPasswordPending}>
                <KeyRound className="mr-2 h-4 w-4" />
                {isPasswordPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose which notification channels are allowed for your account.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={notificationAction} className="space-y-4">
              {!notificationSettingsAvailable ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  Notification preferences are not available yet. Apply the
                  settings migration first, then reload this page.
                </div>
              ) : null}

              <PreferenceToggle
                name="notification_internal_enabled"
                title="Internal popup"
                description="Show notifications in the dashboard navbar."
                defaultChecked={profile.notification_internal_enabled ?? true}
                disabled={isNotificationPending || !notificationSettingsAvailable}
              />
              <PreferenceToggle
                name="notification_email_enabled"
                title="Email"
                description="Allow system notifications to be sent by email."
                defaultChecked={profile.notification_email_enabled ?? true}
                disabled={isNotificationPending || !notificationSettingsAvailable}
              />
              <PreferenceToggle
                name="notification_whatsapp_enabled"
                title="WhatsApp"
                description="Allow WhatsApp notifications when your phone number is available."
                defaultChecked={profile.notification_whatsapp_enabled ?? true}
                disabled={isNotificationPending || !notificationSettingsAvailable}
              />

              <Button
                type="submit"
                variant="outline"
                disabled={isNotificationPending || !notificationSettingsAvailable}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isNotificationPending ? "Saving..." : "Save Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Assignment</CardTitle>
            <CardDescription>
              Role and assignment data are managed by authorized staff.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <InfoRow label="Role" value={ROLE_LABELS[profile.role]} />
            <InfoRow label="Hamlet" value={getRelationName(profile.dusun)} />
            <InfoRow label="Section" value={getRelationName(profile.section)} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function AvatarPreview({ profile }: { profile: SettingsProfile }) {
  const initial = profile.full_name.charAt(0).toUpperCase() || "U";

  if (profile.avatar_signed_url) {
    return (
      <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={profile.avatar_signed_url}
          alt="Profile avatar"
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary-50 text-2xl font-bold text-primary-700">
      <Camera className="mr-1 h-5 w-5" />
      {initial}
    </div>
  );
}

function PreferenceToggle({
  name,
  title,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  disabled: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <span>
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="max-w-[180px] text-right text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function useActionToast(state: ActionState) {
  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);
}

function getRelationName(relation: RelationName[] | RelationName | null | undefined) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}
