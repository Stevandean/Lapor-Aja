import { Building2 } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { VillageSectionStatusButton } from "@/src/features/master-data/components/VillageSectionStatusButton";
import type { VillageSection } from "@/src/features/master-data/queries";

type VillageSectionTableProps = {
  sections: VillageSection[];
};

export function VillageSectionTable({ sections }: VillageSectionTableProps) {
  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Building2 className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          No village sections found
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Add village sections to assign village-handled reports to Kasi.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Section</th>
              <th className="px-5 py-4 font-semibold">Code</th>
              <th className="px-5 py-4 font-semibold">Description</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sections.map((section) => (
              <tr
                key={section.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">
                    {section.name}
                  </p>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {section.code || "-"}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  <p className="max-w-md line-clamp-2">
                    {section.description || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <Badge
                    className={
                      section.is_active
                        ? "bg-success-50 text-success-700 border-success-100"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {section.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>

                <td className="px-5 py-4 text-right">
                  <VillageSectionStatusButton
                    sectionId={section.id}
                    isActive={section.is_active}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {sections.map((section) => (
          <div key={section.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{section.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.code || "-"}
                </p>
              </div>

              <Badge
                className={
                  section.is_active
                    ? "bg-success-50 text-success-700 border-success-100"
                    : "bg-muted text-muted-foreground border-border"
                }
              >
                {section.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {section.description || "-"}
            </p>

            <div className="mt-4">
              <VillageSectionStatusButton
                sectionId={section.id}
                isActive={section.is_active}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}