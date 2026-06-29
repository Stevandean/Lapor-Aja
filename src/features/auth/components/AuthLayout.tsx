import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
};

export function AuthLayout({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.45),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_32%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative flex min-h-screen flex-col gap-15 p-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-lg font-bold text-white">Lapor Aja</p>
                  <p className="text-xs text-sidebar-muted">
                    Village Public Reporting System
                  </p>
                </div>
              </Link>

              <div className="mt-20 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-primary-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
                  Digital public service platform
                </div>

                <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white">
                  Report, verify, and monitor village issues in one system.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-muted">
                  A structured reporting platform for citizens, village admins,
                  hamlet heads, and village leaders to manage public complaints
                  transparently.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <MetricCard value="GPS" label="Map report" />
                  <MetricCard value="PHOTO" label="Evidence upload" />
                  <MetricCard value="TRACK" label="Progress tracking" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-3 w-1/2">
                <ProcessItem
                  icon={<ClipboardList className="h-4 w-4" />}
                  title="Submit report"
                  description="Citizens send reports with photos and location."
                />
                <ProcessItem
                  icon={<MapPin className="h-4 w-4" />}
                  title="Field verification"
                  description="Hamlet heads verify cases directly on site."
                />
                <ProcessItem
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Official follow-up"
                  description="Village admins classify and process reports."
                />
              </div>

              {/* <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-floating backdrop-blur">
                <div className="rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Latest Report
                      </p>
                      <h3 className="mt-1 text-sm font-bold">
                        Damaged village road
                      </h3>
                    </div>

                    <span className="rounded-full border border-warning-100 bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
                      Verification
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-100 p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Dusun Krajan, Main Road Area
                    </div>

                    <div className="mt-3 h-24 rounded-xl bg-[linear-gradient(135deg,#dbeafe_25%,transparent_25%),linear-gradient(225deg,#dbeafe_25%,transparent_25%),linear-gradient(45deg,#dbeafe_25%,transparent_25%),linear-gradient(315deg,#dbeafe_25%,#eff6ff_25%)] bg-[length:20px_20px] bg-[position:10px_0,10px_0,0_0,0_0]" />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      SLA: 24 hours
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                      View detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold text-foreground">Lapor Aja</p>
                  <p className="text-xs text-muted-foreground">
                    Village Public Reporting System
                  </p>
                </div>
              </Link>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold text-primary">
                Secure access
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="section-surface p-5 sm:p-6">{children}</div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link
                href={footerHref}
                className="font-semibold text-primary hover:text-primary-700"
              >
                {footerLinkText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-sidebar-muted">{label}</p>
    </div>
  );
}

function ProcessItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary-100">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-sidebar-muted">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}