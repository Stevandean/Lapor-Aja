import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Textarea({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        className={cn(
          "min-h-28 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none",
          "placeholder:text-muted-foreground",
          "transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          error && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/15",
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