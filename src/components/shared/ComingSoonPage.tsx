import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/Card";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page under development</CardTitle>
          <CardDescription>
            This page has been prepared as part of the dashboard structure and
            will be completed in the next development step.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Feature coming soon
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The layout and access control are ready. The feature content will
              be added later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}