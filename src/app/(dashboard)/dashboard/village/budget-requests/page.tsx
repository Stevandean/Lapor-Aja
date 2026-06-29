import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowLeft, Clock3, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { VillageBudgetRequestsTable } from "@/src/features/village/components/VillageBudgetRequestsTable";
import { getVillageBudgetRequestsData } from "@/src/features/village/queries";

type BudgetRequestRows = ComponentProps<
  typeof VillageBudgetRequestsTable
>["requests"];

export default async function VillageBudgetRequestsPage() {
  const { budgetSchemaReady, reviewSchemaReady, stats, requests } =
    await getVillageBudgetRequestsData();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to village dashboard
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">
            Budget Requests
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kasi Budget Request Monitoring
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review budget needs proposed by Kasi from reports assigned to each
            village section.
          </p>
        </div>
      </section>

      {!budgetSchemaReady ? <BudgetSchemaNotice /> : null}
      {budgetSchemaReady && !reviewSchemaReady ? <ReviewSchemaNotice /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <VillageStatCard
          title="Requests"
          value={stats.totalRequests}
          description="Budget proposals submitted by Kasi."
          icon={<Wallet className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Total Estimate"
          value={formatCurrency(stats.totalEstimatedBudget)}
          description="Combined estimated budget value."
          icon={<Wallet className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Waiting Budget"
          value={stats.waitingBudgetReports}
          description="Related reports currently waiting for budget."
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Budget Requests</CardTitle>
          <CardDescription>
            Showing the latest budget requests submitted from section-level
            handling.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {budgetSchemaReady ? (
            <VillageBudgetRequestsTable
              requests={requests as BudgetRequestRows}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                Budget request tables are not ready
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Apply the budget migration to Supabase before reviewing Kasi
                budget proposals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSchemaNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Budget review columns are not available yet. Apply the migration{" "}
      <span className="font-semibold">
        supabase/migrations/202606240002_budget_request_review.sql
      </span>{" "}
      to Supabase before approving or rejecting requests.
    </div>
  );
}

function BudgetSchemaNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Budget request tables are not available yet. Apply the migration{" "}
      <span className="font-semibold">
        supabase/migrations/202606240001_kasi_progress_workflow.sql
      </span>{" "}
      to Supabase, then reload this page.
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
