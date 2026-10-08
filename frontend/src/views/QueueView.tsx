import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TicketTable } from "../components/queue/TicketTable";
import { Button } from "../components/ui/Button";
import { TextInput } from "../components/ui/Field";
import { LoadingBox } from "../components/ui/Module";
import { cn } from "../lib/cn";
import { slaOf } from "../lib/sla";
import { useStore } from "../lib/store";
import {
  OPEN_STATUSES,
  PRACTICE_LABEL,
  type Practice,
  type Priority,
  type TicketStatus,
} from "../lib/types";

const STATUS_FILTERS: { value: TicketStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevo" },
  { value: "en_progreso", label: "En progreso" },
  { value: "pendiente_usuario", label: "Pendiente" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
];

const PRIORITY_FILTERS: (Priority | "todas")[] = [
  "todas",
  "P1",
  "P2",
  "P3",
  "P4",
];

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-7 cursor-pointer rounded-[3px] border px-2.5 text-[12px] transition-colors duration-150",
        active
          ? "border-ink bg-ink text-paper"
          : "border-rule text-ink-2 hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

export function QueueView() {
  const { practice } = useParams<{ practice: string }>();
  const { tickets, now, hydrating } = useStore();
  const navigate = useNavigate();

  const [status, setStatus] = useState<TicketStatus | "todos">("todos");
  const [priority, setPriority] = useState<Priority | "todas">("todas");
  const [query, setQuery] = useState("");

  const valid: Practice | null =
    practice === "incidente" || practice === "requerimiento" ? practice : null;

  const filtered = useMemo(() => {
    if (!valid) return [];
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (t.practice !== valid) return false;
      if (status !== "todos" && t.status !== status) return false;
      if (priority !== "todas" && t.priority !== priority) return false;
      if (q) {
        const haystack = `${t.id} ${t.subject} ${t.requester}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, valid, status, priority, query]);

  const open = useMemo(
    () =>
      valid
        ? tickets.filter(
            (t) => t.practice === valid && OPEN_STATUSES.includes(t.status),
          )
        : [],
    [tickets, valid],
  );
  const atRisk = useMemo(
    () => open.filter((t) => slaOf(t, now).level !== "ok").length,
    [open, now],
  );

  if (!valid) {
    return (
      <EmptyQueue
        title="Cola no encontrada"
        hint="La práctica solicitada no existe en esta versión."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight">
            {PRACTICE_LABEL[valid]}s
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {open.length} abiertos ·{" "}
            <span className={atRisk > 0 ? "font-mono tabular-nums text-amber" : ""}>
              {atRisk} en riesgo de SLA
            </span>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/nuevo?practice=${valid}`)}
        >
          Nuevo {PRACTICE_LABEL[valid].toLowerCase()}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            active={status === f.value}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </FilterChip>
        ))}
        <span className="mx-1 h-5 w-px bg-rule" aria-hidden />
        {PRIORITY_FILTERS.map((p) => (
          <FilterChip
            key={p}
            active={priority === p}
            onClick={() => setPriority(p)}
          >
            {p === "todas" ? "Todas" : p}
          </FilterChip>
        ))}
        <div className="ml-auto w-72">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID, asunto o solicitante"
            aria-label="Buscar en la cola"
          />
        </div>
      </div>

      <div className="mt-4">
        {hydrating ? (
          <LoadingBox label="Cargando la cola del servidor…" />
        ) : (
          <TicketTable
            tickets={filtered}
            initialSort={[{ id: "sla", desc: false }]}
            emptyTitle="Sin tickets en esta vista"
            emptyHint={
              query
                ? `Ningún ticket coincide con «${query}». Ajusta la búsqueda o los filtros.`
                : `Sin ${PRACTICE_LABEL[valid].toLowerCase()}s con estos filtros.`
            }
            emptyAction={
              <Button
                variant="primary"
                className="mt-2"
                onClick={() => navigate(`/nuevo?practice=${valid}`)}
              >
                Nuevo {PRACTICE_LABEL[valid].toLowerCase()}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

export function EmptyQueue({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-[3px] border border-dashed border-rule-2 bg-raised px-6 py-16 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="text-[13px] text-ink-3">{hint}</p>
      {action}
    </div>
  );
}
