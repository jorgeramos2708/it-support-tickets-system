import { cn } from "../../lib/cn";
import {
  PRACTICE_BG,
  PRACTICE_LABEL,
  PRIORITY_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
  type PracticeAll,
  type Priority,
  type TicketStatus,
} from "../../lib/types";

/** Badge de práctica: punto cuadrado en el matiz de la práctica, sin fondo de color. */
export function PracticeBadge({ practice }: { practice: PracticeAll }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
      <span aria-hidden className={cn("size-1.5 rounded-[1px]", PRACTICE_BG[practice])} />
      {PRACTICE_LABEL[practice]}
    </span>
  );
}

/** Chip de prioridad: el rango se lleva en peso y relleno, P1 es el único crítico en rojo. */
export function PriorityChip({
  priority,
  full = false,
  className,
}: {
  priority: Priority;
  full?: boolean;
  className?: string;
}) {
  const label = full ? PRIORITY_LABEL[priority] : priority;
  const skin =
    priority === "P1"
      ? "bg-signal text-paper font-semibold"
      : priority === "P2"
        ? "bg-ink text-paper font-semibold"
        : priority === "P3"
          ? "border border-rule-2 text-ink-2 font-medium"
          : "border border-rule-2 text-ink-3 font-medium";
  return (
    <span
      title={PRIORITY_LABEL[priority]}
      className={cn(
        "inline-flex items-center rounded-[3px] px-1.5 py-0.5 font-mono text-[12px] tabular-nums",
        skin,
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Estado: punto + nombre, el color es solo del punto. */
export function StatusBadge({ status }: { status: TicketStatus }) {
  const muted = status === "cerrado" || status === "resuelto";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12.5px]",
        muted ? "text-ink-3" : "text-ink-2",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
