import { VillageSectionCreateModal } from "@/src/features/master-data/components/VillageSectionCreateModal";
import { VillageSectionTable } from "@/src/features/master-data/components/VillageSectionTable";
import { getVillageSections } from "@/src/features/master-data/queries";

export default async function AdminVillageSectionsPage() {
  const sections = await getVillageSections();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Master Data</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Village Sections
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage internal village sections used to assign reports handled by
            the village to the appropriate Kasi.
          </p>
        </div>

        <VillageSectionCreateModal />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Section List
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Active sections can later be assigned to Kasi users and internal
            village reports.
          </p>
        </div>

        <VillageSectionTable sections={sections} />
      </section>
    </div>
  );
}