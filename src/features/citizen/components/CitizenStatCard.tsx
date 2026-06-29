type CitizenStatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
};

export function CitizenStatCard({
  title,
  value,
  description,
  icon,
}: CitizenStatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}