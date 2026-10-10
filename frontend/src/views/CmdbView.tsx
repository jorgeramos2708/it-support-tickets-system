import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TextInput } from "../components/ui/Field";
import { cn } from "../lib/cn";
import { CI_TICKET_HINTS } from "../lib/data";
import { useStore } from "../lib/store";
import {
  CI_CRIT_LABEL,
  CI_ENV_LABEL,
  CI_TYPE_LABEL,
  RELATION_LABEL,
  STATUS_LABEL,
  type CiType,
  type ConfigItem,
  type Ticket,
} from "../lib/types";

const TYPE_FILTERS: (CiType | "todos")[] = [
  "todos",
  "servidor",
  "aplicacion",
  "servicio",
  "red",
  "estacion",
  "impresora",
];

const CRIT_TEXT: Record<ConfigItem["criticality"], string> = {
  alta: "text-signal font-semibold",
  media: "text-ink-2",
  baja: "text-ink-3",
};

function linkedTicketsOf(ci: ConfigItem, tickets: Ticket[]): Ticket[] {
  const hints = CI_TICKET_HINTS[ci.id] ?? [];
  return hints
    .map((tid) => tickets.find((t) => t.id === tid))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
}

export function CmdbView() {
  const { cis, tickets } = useStore();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CiType | "todos">("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cis.filter((ci) => {
      if (type !== "todos" && ci.type !== type) return false;
      if (q && !`${ci.id} ${ci.name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cis, type, query]);

  return (
    <div className="mx-auto max-w-[1200px] animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] leading-[1.1] font-extrabold tracking-tight">
            CMDB
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            Elementos de configuración y sus relaciones ·{" "}
            <span className="font-mono tabular-nums">{cis.length} CIs</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => setType(t)}
            className={cn(
              "h-7 cursor-pointer rounded-xl border px-2.5 text-[12px] transition-colors duration-150",
              type === t
                ? "border-ink bg-ink text-paper"
                : "border-rule text-ink-2 hover:border-ink",
            )}
          >
            {t === "todos" ? "Todos" : CI_TYPE_LABEL[t]}
          </button>
        ))}
        <div className="ml-auto w-72">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ID o nombre"
            aria-label="Buscar en la CMDB"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-rule">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-raised/60">
              {["", "ID", "Nombre", "Tipo", "Ambiente", "Criticidad", "Relaciones", "Tickets"].map(
                (label, i) => (
                  <th key={i} scope="col" className="label px-3 py-2 text-ink-3">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((ci) => {
              const isOpen = expanded === ci.id;
              const linked = linkedTicketsOf(ci, tickets);
              return (
                <Fragment key={ci.id}>
                  <tr
                    className={cn(
                      "cursor-pointer border-b border-rule transition-colors duration-150 last:border-b-0 hover:bg-raised",
                      isOpen && "bg-raised",
                    )}
                    onClick={() => setExpanded(isOpen ? null : ci.id)}
                  >
                    <td className="w-8 px-2 py-2.5 text-ink-3">
                      {isOpen ? (
                        <ChevronUp size={13} strokeWidth={2} aria-hidden />
                      ) : (
                        <ChevronDown size={13} strokeWidth={2} aria-hidden />
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12.5px] tabular-nums text-ink-2">
                      {ci.id}
                    </td>
                    <td className="px-3 py-2.5 text-[13.5px] font-medium text-ink">
                      {ci.name}
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] text-ink-2">
                      {CI_TYPE_LABEL[ci.type]}
                    </td>
                    <td className="px-3 py-2.5 text-[12.5px] text-ink-2">
                      {CI_ENV_LABEL[ci.environment]}
                    </td>
                    <td className={cn("px-3 py-2.5 text-[12.5px]", CRIT_TEXT[ci.criticality])}>
                      {CI_CRIT_LABEL[ci.criticality]}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                      {ci.relations.length}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                      {linked.length}
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr key={`${ci.id}-exp`} className="border-b border-rule last:border-b-0">
                      <td colSpan={8} className="bg-raised/70 px-8 py-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <section aria-label="Relaciones">
                            <h3 className="label mb-2 text-ink-3">Relaciones</h3>
                            {ci.relations.length === 0 ? (
                              <p className="text-[13px] text-ink-3">
                                Sin relaciones registradas.
                              </p>
                            ) : (
                              <ul className="space-y-1.5">
                                {ci.relations.map((rel) => {
                                  const target = cis.find((c) => c.id === rel.ciId);
                                  return (
                                    <li
                                      key={rel.ciId}
                                      className="flex items-baseline gap-2 text-[13px]"
                                    >
                                      <span className="font-mono text-[11.5px] text-ink-3">
                                        {rel.ciId}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-ink-2">
                                        <span className="italic">{RELATION_LABEL[rel.kind]}</span>{" "}
                                        {target ? target.name.split(" — ")[0] : "—"}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </section>
                          <section aria-label="Tickets ligados">
                            <h3 className="label mb-2 text-ink-3">Tickets ligados</h3>
                            {linked.length === 0 ? (
                              <p className="text-[13px] text-ink-3">
                                Sin tickets de soporte recientes.
                              </p>
                            ) : (
                              <ul className="space-y-1.5">
                                {linked.map((t) => (
                                  <li key={t.id}>
                                    <Link
                                      to={`/ticket/${t.id}`}
                                      className="flex items-baseline gap-2 text-[13px] link-grow hover:link-grow-hover font-bold text-amber hover:text-amber-hi"
                                    >
                                      <span className="font-mono text-[11.5px] text-ink-3">
                                        {t.id}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-ink-2">
                                        {t.subject}
                                      </span>
                                      <span className="text-[12px] text-ink-3">
                                        {STATUS_LABEL[t.status]}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </section>
                        </div>
                        <p className="mt-4 text-[12px] text-ink-3">
                          Propietario: {ci.owner}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="border-t border-rule px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-ink">
              Sin elementos para esta vista
            </p>
            <p className="mt-1 text-[13px] text-ink-3">
              Ajusta la búsqueda o el tipo de elemento.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
