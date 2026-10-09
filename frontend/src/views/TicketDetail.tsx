import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { PriorityChip, PracticeBadge, StatusBadge } from "../components/ui/Chips";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/Field";
import { SLAMeter } from "../components/ui/SLAMeter";
import { cn } from "../lib/cn";
import { fmtClock, fmtRelative, slaOf } from "../lib/sla";
import { useStore } from "../lib/store";
import {
  OPEN_STATUSES,
  PRACTICE_LABEL,
  STATUS_LABEL,
  type EventKind,
  type Ticket,
  type TicketStatus,
} from "../lib/types";
import { EmptyQueue } from "./QueueView";

const KIND_TEXT: Record<EventKind, string> = {
  creado: "Registrado",
  estado: "Cambio de estado",
  nota: "Nota",
  asignacion: "Asignación",
  prioridad: "Prioridad",
  adjunto: "Adjuntos",
};

function eventTitle(ev: Ticket["events"][number]): string {
  if (ev.kind === "estado") return `Estado → ${STATUS_LABEL[ev.to as TicketStatus]}`;
  if (ev.kind === "asignacion") return `Asignado a ${ev.to}`;
  return KIND_TEXT[ev.kind];
}

function fmtSize(kb: number): string {
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function Propiedad({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-rule px-4 py-2.5 first:border-t-0">
      <dt className="label w-24 shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px] text-ink-2">{children}</dd>
    </div>
  );
}

function AsideModule({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[3px] border border-rule">
      <header className="border-b border-rule px-4 py-2.5">
        <h2 className="label text-ink-2">{title}</h2>
      </header>
      {children}
    </section>
  );
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    getTicket,
    now,
    transition,
    takeTicket,
    addNote,
    allowedTransitions,
  } = useStore();
  const navigate = useNavigate();
  const [note, setNote] = useState("");

  const ticket = id ? getTicket(id) : undefined;

  if (!ticket) {
    return (
      <EmptyQueue
        title="Ticket no encontrado"
        hint="El identificador no corresponde a ningún ticket registrado. Puede haber sido eliminado o el enlace estar incompleto."
        action={
          <Button variant="outline" className="mt-2" onClick={() => navigate("/cola/incidente")}>
            Volver a incidentes
          </Button>
        }
      />
    );
  }

  const open = OPEN_STATUSES.includes(ticket.status);
  const sla = slaOf(ticket, now);
  const nextStates = allowedTransitions(ticket);

  const confirmAndExecute = (to: TicketStatus, label: string) => {
    const isTerminal = to === "cerrado";
    if (!window.confirm(
      isTerminal
        ? `¿Cerrar el ticket ${ticket.id}? Esta acción es permanente y no se puede revertir.`
        : `¿Marcar como ${to === "resuelto" ? "resuelto" : label}?`
    )) return;
    transition(ticket.id, to);
  };

  const submitNote = () => {
    const text = note.trim();
    if (!text) return;
    addNote(ticket.id, text);
    setNote("");
  };

  return (
    <div className="mx-auto max-w-[1100px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to={`/cola/${ticket.practice}`}
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          {PRACTICE_LABEL[ticket.practice]}s
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="font-mono text-[12.5px] tabular-nums text-ink-3">
          {ticket.id}
        </span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="max-w-3xl font-display text-[22px] leading-snug font-semibold tracking-tight">
            {ticket.subject}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <PracticeBadge practice={ticket.practice} />
            <PriorityChip priority={ticket.priority} full />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {open && !ticket.assignee ? (
            <Button variant="secondary" onClick={() => takeTicket(ticket.id)}>
              Tomar
            </Button>
          ) : null}
          {nextStates
            .filter((s) => s !== "cerrado")
            .map((s) => (
              <Button
                key={s}
                variant={s === "resuelto" ? "primary" : "outline"}
                onClick={() => confirmAndExecute(s, STATUS_LABEL[s])}
              >
                {s === "resuelto" ? "Resolver" : STATUS_LABEL[s]}
              </Button>
            ))}
          {nextStates.includes("cerrado") ? (
            <Button variant="ghost" onClick={() => confirmAndExecute("cerrado", "Cerrar")}>
              Cerrar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section aria-label="Descripción">
            <h2 className="label text-ink-2">Descripción</h2>
            <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
              {ticket.description}
            </p>
          </section>

          <section className="mt-8" aria-label="Bitácora">
            <h2 className="label text-ink-2">Bitácora</h2>

            <div className="mt-3 rounded-[3px] border border-rule bg-raised p-3">
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submitNote();
                  }
                }}
                placeholder="Agregar una nota a la bitácora… (visible para el equipo)"
                aria-label="Nueva nota"
                className="min-h-16 border-0 bg-transparent focus:border-0"
              />
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="font-mono text-[11px] text-ink-3">Ctrl+⏎ agrega la nota</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!note.trim()}
                  onClick={submitNote}
                >
                  Agregar nota
                </Button>
              </div>
            </div>

            <ol className="relative mt-5 space-y-5 border-l border-rule pl-5">
              {ticket.events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1 -left-[26.5px] size-2 rounded-full",
                      ev.kind === "creado"
                        ? "bg-ink"
                        : ev.kind === "estado"
                          ? "bg-ink/50"
                          : "bg-rule-2",
                    )}
                  />
                  <p className="text-[12px] text-ink-3">
                    {eventTitle(ev)} · {ev.actor} · {fmtRelative(ev.at, now)}
                  </p>
                  {ev.detail ? (
                    <p className="mt-0.5 max-w-[65ch] text-[13px] text-ink-2">
                      {ev.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <AsideModule title={open ? "SLA en curso" : "SLA final"}>
            <div className="px-4 py-4">
              <SLAMeter ticket={ticket} now={now} variant="large" />
            </div>
          </AsideModule>

          <AsideModule title="Propiedades">
            <dl>
              <Propiedad label="Solicitante">{ticket.requester}</Propiedad>
              <Propiedad label="Departamento">{ticket.dept}</Propiedad>
              <Propiedad label="Asignado">
                {ticket.assignee ?? "Sin asignar"}
              </Propiedad>
              <Propiedad label="Creado">
                <span className="font-mono text-[12px] tabular-nums">
                  {fmtClock(ticket.createdAt)}
                </span>
              </Propiedad>
              <Propiedad label="Actualizado">
                <span className="font-mono text-[12px] tabular-nums">
                  {fmtClock(ticket.updatedAt)}
                </span>
              </Propiedad>
            </dl>
          </AsideModule>

          {ticket.attachments.length > 0 ? (
            <AsideModule title="Adjuntos">
              <ul>
                {ticket.attachments.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center gap-2 border-t border-rule px-4 py-2.5 first:border-t-0"
                  >
                    <FileText size={14} strokeWidth={1.75} aria-hidden className="text-ink-3" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">
                      {file.name}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-ink-3">
                      {fmtSize(file.sizeKb)}
                    </span>
                  </li>
                ))}
              </ul>
            </AsideModule>
          ) : null}

          {sla.level === "breach" && open ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[3px] border border-rule bg-raised px-4 py-3 text-[13px] text-ink-2"
            >
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
              El objetivo de resolución está vencido. Escala al responsable de
              turno y documenta la causa en la bitácora.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
