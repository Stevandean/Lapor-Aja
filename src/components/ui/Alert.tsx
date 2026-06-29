import { cn } from "@/src/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";

type AlertProps = {
  title?: string;
  message: string;
  variant?: AlertVariant;
  className?: string;
};

const alertVariants: Record<AlertVariant, string> = {
  info: "border-info-100 bg-info-50 text-info-700",
  success: "border-success-100 bg-success-50 text-success-700",
  warning: "border-warning-100 bg-warning-50 text-warning-700",
  danger: "border-danger-100 bg-danger-50 text-danger-700",
};

export function Alert({
  title,
  message,
  variant = "info",
  className,
}: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm",
        alertVariants[variant],
        className
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      <p className={cn(title && "mt-1")}>{message}</p>
    </div>
  );
}