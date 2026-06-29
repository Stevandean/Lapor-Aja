import type { InputHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={cn(
          "form-input",
          error && "border-danger-600 focus:border-danger-600 focus:shadow-none",
          className
        )}
        {...props}
      />

      {error ? (
        <p className="form-error">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}