import type { ReactNode } from "react";
import { Card, CardContent } from "@/src/components/ui/Card";

type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
};

export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}