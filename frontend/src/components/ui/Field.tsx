import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

const control =
  "h-9 w-full rounded-[3px] border border-rule bg-raised px-3 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3 focus:border-ink focus:outline-none";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label block text-ink-2">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] text-ink-3">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(control, "h-auto min-h-24 resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "cursor-pointer", className)} {...props} />;
}

/** Control segmentado: la selección es inversión, no color. */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="inline-flex overflow-hidden rounded-[3px] border border-rule"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-9 min-w-20 cursor-pointer border-r border-rule px-4 text-sm transition-colors duration-150 last:border-r-0",
            value === opt.value
              ? "bg-ink font-medium text-paper"
              : "bg-raised text-ink-2 hover:bg-rule/40",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
