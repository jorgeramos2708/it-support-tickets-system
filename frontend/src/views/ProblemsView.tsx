import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/Field";
import { DotStatus, Module, Propiedad } from "../components/ui/Module";
import { SLAMeter } from "../components/ui/SLAMeter";
import { cn } from "../lib/cn";
import { fmtRelative } from "../lib/sla";
import { useStore } from "../lib/store";
import {
  PROBLEM_STATUS_DOT,
  PROBLEM_STATUS_LABEL,
  type ProblemStatus,
} from "../lib/types";
import { EmptyQueue } from "./QueueView";

const PROBLEM_TRANSITIONS: Record<ProblemStatus, ProblemStatus[]> = {
  nuevo: ["investigacion"],
  investigacion: ["resuelto"],
  resuelto: ["cerrado"],
  cerrado: [],
};

export function ProblemsView() {
  const { problems, now, pulses } = useStore();
  const navigate = useNavigate();
  const sorted = [...problems].sort((a, b) => b.updatedAt - a.updatedAt);
  const investigating = problems.filter(
    (p) => p.status === "nuevo" || p.status === "investigacion",
  ).length;

  return (
    <div className="mx-auto max-w-[1200px] animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] leading-[1.1] font-extrabold tracking-tight">
            Problemas
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            Gestión de problemas: causa raíz de incidentes recurrentes ·{" "}
            <span className="font-mono tabular-nums text-amber">
              {investigating} activos
            </span>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/nuevo/problema")}
        >
          Nuevo problema
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-rule">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-raised/60">
              {["ID", "Título", "Incidentes", "Estado", "Causa raíz", "Asignado", "Actualizado"].map(
                (label) => (
                  <th key={label} scope="col" className="label px-3 py-2 text-ink-3">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const pulse = pulses[p.id] ?? 0;
              return (
                <tr
                  key={`${p.id}-${pulse}`}
                  className={cn(
                    "cursor-pointer border-b border-rule transition-colors duration-150 last:border-b-0 hover:bg-raised",
                    pulse > 0 && "animate-pulse-row",
                  )}
                  onClick={() => navigate(`/problemas/${p.id}`)}
                >
                  <td className="px-3 py-2.5 font-mono text-[12.5px] tabular-nums text-ink-2">
                    {p.id}
                  </td>
                  <td className="px-3 py-2.5 text-[13.5px] font-medium text-ink">
                    {p.title}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                    {p.linkedIncidentIds.length}
                  </td>
                  <td className="px-3 py-2.5">
                    <DotStatus
                      dot={PROBLEM_STATUS_DOT[p.status]}
                      label={PROBLEM_STATUS_LABEL[p.status]}
                      muted={p.status === "cerrado"}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]">
                    {p.causeRaiz ? (
                      <span className="text-good">Registrada</span>
                    ) : (
                      <span className="text-ink-3">Pendiente</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-ink-2">
                    {p.assignee ?? "Sin asignar"}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] tabular-nums text-ink-3">
                    {fmtRelative(p.updatedAt, now)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-rule bg-raised/60 px-3 py-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-3">
            {problems.length} problemas
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { problems, tickets, now, setProblemStatus, setProblemRootCause } =
    useStore();
  const navigate = useNavigate();
  const problem = problems.find((p) => p.id === id);
  const [rca, setRca] = useState("");
  const [editingRca, setEditingRca] = useState(false);

  if (!problem) {
    return (
      <EmptyQueue
        title="Problema no encontrado"
        hint="El identificador no corresponde a ningún problema registrado."
        action={
          <Button variant="outline" className="mt-2" onClick={() => navigate("/problemas")}>
            Volver a problemas
          </Button>
        }
      />
    );
  }

  const linked = problem.linkedIncidentIds
    .map((tid) => tickets.find((t) => t.id === tid))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const next = PROBLEM_TRANSITIONS[problem.status];

  const saveRca = () => {
    const text = rca.trim();
    if (!text) return;
    setProblemRootCause(problem.id, text);
    setEditingRca(false);
  };

  return (
    <div className="mx-auto max-w-[1100px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to="/problemas"
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          Problemas
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="font-mono text-[12.5px] tabular-nums text-ink-3">
          {problem.id}
        </span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="max-w-3xl font-display text-[30px] leading-[1.2] font-extrabold tracking-tight">
            {problem.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <DotStatus
              dot={PROBLEM_STATUS_DOT[problem.status]}
              label={PROBLEM_STATUS_LABEL[problem.status]}
              muted={problem.status === "cerrado"}
            />
            {problem.workaround ? (
              <span className="rounded-xl border border-rule-2 px-1.5 py-0.5 text-[11px] text-ink-2">
                Con workaround temporal
              </span>
            ) : null}
            <span className="text-[12.5px] text-ink-3">
              Asignado: {problem.assignee ?? "Sin asignar"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {next.includes("investigacion") ? (
            <Button variant="outline" onClick={() => setProblemStatus(problem.id, "investigacion")}>
              Investigar
            </Button>
          ) : null}
          {next.includes("resuelto") ? (
            <Button
              variant="primary"
              onClick={() => setProblemStatus(problem.id, "resuelto")}
            >
              Resolver problema
            </Button>
          ) : null}
          {next.includes("cerrado") ? (
            <Button variant="ghost" onClick={() => setProblemStatus(problem.id, "cerrado")}>
              Cerrar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section aria-label="Descripción">
            <h2 className="label text-ink-2">Descripción</h2>
            <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
              {problem.description}
            </p>
          </section>

          <section aria-label="Causa raíz">
            <div className="flex items-center gap-2">
              <h2 className="label text-ink-2">Causa raíz</h2>
              {problem.causeRaiz && !editingRca ? (
                <button
                  type="button"
                  onClick={() => {
                    setRca(problem.causeRaiz ?? "");
                    setEditingRca(true);
                  }}
                  className="cursor-pointer text-[12px] text-ink-3 underline decoration-rule-2 underline-offset-[3px] hover:text-ink hover:decoration-ink"
                >
                  Editar
                </button>
              ) : null}
            </div>
            {problem.causeRaiz && !editingRca ? (
              <p className="mt-2 max-w-[68ch] rounded-xl border border-rule bg-raised px-4 py-3 text-[14px] leading-relaxed text-ink-2">
                {problem.causeRaiz}
              </p>
            ) : (
              <div className="mt-2 max-w-[68ch] rounded-xl border border-rule bg-raised p-3">
                <TextArea
                  value={rca}
                  onChange={(e) => setRca(e.target.value)}
                  placeholder="Documenta la causa raíz identificada: qué falla, por qué, y la evidencia que la confirma…"
                  aria-label="Causa raíz"
                  className="border-0 bg-transparent focus:border-0"
                />
                <div className="flex items-center justify-end gap-2 px-1 pb-1">
                  {problem.causeRaiz ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditingRca(false)}>
                      Cancelar
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!rca.trim()}
                    onClick={saveRca}
                  >
                    Guardar causa raíz
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section aria-label="Incidentes ligados">
            <h2 className="label text-ink-2">Incidentes ligados</h2>
            {linked.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">
                Sin incidentes ligados. Usa la paleta ⌘K para abrir incidentes
                que presenten el mismo síntoma.
              </p>
            ) : (
              <ul className="mt-2">
                {linked.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/ticket/${t.id}`}
                      className="flex items-center gap-3 rounded-xl border border-rule px-4 py-2.5 transition-colors duration-150 first:mt-0 mt-2 hover:bg-raised"
                    >
                      <span className="font-mono text-[12px] tabular-nums text-ink-3">
                        {t.id}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                        {t.subject}
                      </span>
                      <SLAMeter ticket={t} now={now} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Module title="Propiedades">
            <dl>
              <Propiedad label="Estado">
                {PROBLEM_STATUS_LABEL[problem.status]}
              </Propiedad>
              <Propiedad label="Asignado">
                {problem.assignee ?? "Sin asignar"}
              </Propiedad>
              <Propiedad label="Creado">{fmtRelative(problem.createdAt, now)}</Propiedad>
              <Propiedad label="Actualizado">{fmtRelative(problem.updatedAt, now)}</Propiedad>
              <Propiedad label="Incidentes">
                <span className="font-mono text-[12px] tabular-nums">
                  {problem.linkedIncidentIds.length}
                </span>
              </Propiedad>
            </dl>
          </Module>
          {problem.status === "investigacion" ? (
            <p className="flex items-start gap-2 rounded-xl border border-rule bg-raised px-4 py-3 text-[13px] text-ink-2">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber" />
              Un problema en investigación no se cierra sin causa raíz
              documentada — registra la evidencia antes de resolver.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
