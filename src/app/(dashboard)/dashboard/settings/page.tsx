import { SettingsForms } from "@/src/features/settings/components/SettingsForms";
import { getSettingsProfile } from "@/src/features/settings/queries";

export default async function SettingsPage() {
  const profile = await getSettingsProfile();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Settings</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Account Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage your profile, password, and notification preferences.
        </p>
      </section>

      <SettingsForms profile={profile} />
    </div>
  );
}
