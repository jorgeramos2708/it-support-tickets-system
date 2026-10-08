import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Database,
  LayoutDashboard,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/cn";
import { SLA_LEVEL_TEXT, fmtRemaining, slaOf } from "../lib/sla";
import { useStore } from "../lib/store";
import { OPEN_STATUSES, PRACTICE_LABEL } from "../lib/types";

const ACTIONS: {
  label: string;
  icon: LucideIcon;
  to: string;
  hint: string;
}[] = [
  { label: "Nuevo incidente", icon: Plus, to: "/nuevo?practice=incidente", hint: "Registro ITIL" },
  { label: "Nuevo requerimiento", icon: Plus, to: "/nuevo?practice=requerimiento", hint: "Catálogo" },
  { label: "Nuevo problema", icon: Plus, to: "/nuevo/problema", hint: "Causa raíz" },
  { label: "Nuevo cambio", icon: Plus, to: "/nuevo/cambio", hint: "Flujo CAB" },
  { label: "Ir al dashboard", icon: LayoutDashboard, to: "/", hint: "g d" },
  { label: "Reportes ITIL", icon: BookOpen, to: "/reportes", hint: "g e" },
  { label: "Cola de incidentes", icon: AlertCircle, to: "/cola/incidente", hint: "g i" },
  { label: "Cola de requerimientos", icon: ClipboardList, to: "/cola/requerimiento", hint: "g r" },
  { label: "Problemas", icon: Search, to: "/problemas", hint: "g p" },
  { label: "Cambios", icon: ArrowLeftRight, to: "/cambios", hint: "g c" },
  { label: "CMDB", icon: Database, to: "/cmdb", hint: "g m" },
  { label: "Base de conocimiento", icon: BookOpen, to: "/kb", hint: "g k" },
];

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { tickets, now } = useStore();
  const navigate = useNavigate();

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  // Búsqueda por texto libre sobre toda la cola — cmdk filtra por el `value` de cada item
  const searchableTickets = [...tickets]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Paleta de comandos"
      loop
    >
      <Command.Input
        placeholder="Escribe un comando o busca tickets por ID, asunto o solicitante…"
        autoFocus
      />
      <Command.List>
        <Command.Empty>
          Sin resultados. Prueba con un ID (p. ej. INC-2401) o una palabra del
          asunto.
        </Command.Empty>

        <Command.Group heading="Acciones">
          {ACTIONS.map((a) => (
            <Command.Item
              key={a.label}
              value={`${a.label} ${a.hint}`}
              onSelect={() => go(a.to)}
              className="group/cmdk-item"
            >
              <a.icon size={15} strokeWidth={1.75} aria-hidden />
              {a.label}
              <span cmdk-hint="">{a.hint}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Tickets">
          {searchableTickets.map((t) => {
            const sla = slaOf(t, now);
            return (
              <Command.Item
                key={t.id}
                value={`${t.id} ${t.subject} ${t.requester} ${PRACTICE_LABEL[t.practice]} ${t.assignee ?? ""}`}
                onSelect={() => go(`/ticket/${t.id}`)}
                className="group/cmdk-item"
              >
                <span className="font-mono text-[12px] tabular-nums text-ink-2">
                  {t.id}
                </span>
                <span className="max-w-[280px] truncate">{t.subject}</span>
                <span className="ml-auto flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-[11px] tabular-nums",
                      SLA_LEVEL_TEXT[sla.level],
                    )}
                  >
                    {OPEN_STATUSES.includes(t.status)
                      ? fmtRemaining(sla.remainingMin)
                      : PRACTICE_LABEL[t.practice]}
                  </span>
                  <ArrowRight size={13} strokeWidth={1.75} aria-hidden className="opacity-0 transition-opacity duration-150 group-data-[selected=true]/cmdk-item:opacity-100" />
                </span>
              </Command.Item>
            );
          })}
        </Command.Group>
      </Command.List>
      <div className="border-t border-rule px-3 py-2">
        <p className="font-mono text-[11px] text-ink-3">
          ↑↓ navegar · ⏎ abrir · esc cerrar
        </p>
      </div>
    </Command.Dialog>
  );
}
