import type { SelectHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Select({
  label,
  error,
  helperText,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}

      <select
        id={selectId}
        className={cn(
          "form-input appearance-none",
          "bg-[linear-gradient(45deg,transparent_50%,var(--muted-foreground)_50%),linear-gradient(135deg,var(--muted-foreground)_50%,transparent_50%)]",
          "bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%]",
          "bg-[size:5px_5px,5px_5px]",
          "bg-no-repeat pr-10",
          error && "border-danger-600 focus:border-danger-600 focus:shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </select>

      {error ? (
        <p className="form-error">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}