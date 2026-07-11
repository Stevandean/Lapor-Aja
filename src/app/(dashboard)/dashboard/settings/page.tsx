import { SettingsForms } from "@/src/features/settings/components/SettingsForms";
import { getSettingsProfile } from "@/src/features/settings/queries";

export default async function SettingsPage() {
  const profile = await getSettingsProfile();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Pengaturan</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengaturan Akun
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Kelola profil, kata sandi, dan preferensi notifikasi akun Anda.
        </p>
      </section>

      <SettingsForms profile={profile} />
    </div>
  );
}
