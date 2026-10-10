import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Module({
  title,
  count,
  actions,
  children,
  className,
}: {
  title: string;
  count?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-rule bg-raised shadow-1",
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b border-rule px-4 py-2.5">
        <h2 className="label text-ink-2">{title}</h2>
        {count ? (
          <span className="font-mono text-[11px] tabular-nums text-ink-3">{count}</span>
        ) : null}
        {actions ? <span className="ml-auto">{actions}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function Propiedad({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
      <dt className="label w-24 shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px] text-ink-2">{children}</dd>
    </div>
  );
}

export function DotStatus({
  dot,
  label,
  muted = false,
}: {
  dot: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px]",
        muted ? "text-ink-3" : "text-ink-2",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

/** Carga honesta: esqueleto shimmer, sin spinners. */
export function LoadingBox({ label }: { label: string }) {
  return (
    <div
      className="space-y-2.5 rounded-2xl border border-rule bg-raised px-4 py-6"
      aria-busy="true"
      aria-label={label}
    >
      {[92, 78, 85, 64, 88].map((w, i) => (
        <div
          key={i}
          className="skeleton h-5"
          style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
