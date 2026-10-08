import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { DotStatus, Module, Propiedad } from "../components/ui/Module";
import { cn } from "../lib/cn";
import { fmtRelative } from "../lib/sla";
import { useStore } from "../lib/store";
import {
  APPROVAL_DOT,
  APPROVAL_STATE_LABEL,
  CHANGE_RISK_LABEL,
  CHANGE_STATUS_DOT,
  CHANGE_STATUS_LABEL,
  CHANGE_TYPE_LABEL,
  CHANGE_TYPE_SKIN,
  type Change,
  type ChangeRisk,
} from "../lib/types";
import { EmptyQueue } from "./QueueView";

const RISK_TEXT: Record<ChangeRisk, string> = {
  alto: "text-signal font-semibold",
  medio: "text-amber font-medium",
  bajo: "text-ink-3",
};

function approvalsOf(c: Change): string {
  const ok = c.approvals.filter((a) => a.state === "aprobado").length;
  return `${ok}/${c.approvals.length}`;
}

export function ChangesView() {
  const { changes, now, pulses } = useStore();
  const navigate = useNavigate();
  const sorted = [...changes].sort((a, b) => b.updatedAt - a.updatedAt);
  const enRevision = changes.filter((c) => c.status === "en_revision").length;
  const porImplementar = changes.filter((c) => c.status === "aprobado").length;

  return (
    <div className="mx-auto max-w-[1200px] animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight">
            Cambios
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            <span className="font-mono tabular-nums text-amber">
              {enRevision} en revisión CAB
            </span>{" "}
            · {porImplementar} por implementar
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/nuevo/cambio")}>
          Nuevo cambio
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[3px] border border-rule">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-rule bg-raised/60">
              {["ID", "Título", "Tipo", "Riesgo", "Estado", "Aprobaciones", "Ventana", "Actualizado"].map(
                (label) => (
                  <th key={label} scope="col" className="label px-3 py-2 text-ink-3">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const pulse = pulses[c.id] ?? 0;
              return (
                <tr
                  key={`${c.id}-${pulse}`}
                  className={cn(
                    "cursor-pointer border-b border-rule transition-colors duration-150 last:border-b-0 hover:bg-raised",
                    pulse > 0 && "animate-pulse-row",
                  )}
                  onClick={() => navigate(`/cambios/${c.id}`)}
                >
                  <td className="px-3 py-2.5 font-mono text-[12.5px] tabular-nums text-ink-2">
                    {c.id}
                  </td>
                  <td className="px-3 py-2.5 text-[13.5px] font-medium text-ink">
                    <span className="block max-w-[380px] truncate">{c.title}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[11px]",
                        CHANGE_TYPE_SKIN[c.type],
                      )}
                    >
                      {CHANGE_TYPE_LABEL[c.type]}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2.5 text-[12.5px]", RISK_TEXT[c.risk])}>
                    {CHANGE_RISK_LABEL[c.risk]}
                  </td>
                  <td className="px-3 py-2.5">
                    <DotStatus
                      dot={CHANGE_STATUS_DOT[c.status]}
                      label={CHANGE_STATUS_LABEL[c.status]}
                      muted={c.status === "cerrado"}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] tabular-nums text-ink-2">
                    {approvalsOf(c)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11.5px] text-ink-3">
                    {c.ventana}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] tabular-nums text-ink-3">
                    {fmtRelative(c.updatedAt, now)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-rule bg-raised/60 px-3 py-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-3">
            {changes.length} cambios
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { changes, cis, now, changeDecision, setChangeStatus } = useStore();
  const navigate = useNavigate();
  const change = changes.find((c) => c.id === id);

  if (!change) {
    return (
      <EmptyQueue
        title="Cambio no encontrado"
        hint="El identificador no corresponde a ningún cambio registrado."
        action={
          <Button variant="outline" className="mt-2" onClick={() => navigate("/cambios")}>
            Volver a cambios
          </Button>
        }
      />
    );
  }

  const ciNames = change.ciIds
    .map((ciId) => cis.find((c) => c.id === ciId))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const canVote = change.status === "en_revision";
  const canImplement = change.status === "aprobado";
  const canClose = change.status === "implementado";

  return (
    <div className="mx-auto max-w-[1100px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to="/cambios"
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          Cambios
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="font-mono text-[12.5px] tabular-nums text-ink-3">
          {change.id}
        </span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="max-w-3xl font-display text-[22px] leading-snug font-semibold tracking-tight">
            {change.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span
              className={cn(
                "inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[11px]",
                CHANGE_TYPE_SKIN[change.type],
              )}
            >
              {CHANGE_TYPE_LABEL[change.type]}
            </span>
            <DotStatus
              dot={CHANGE_STATUS_DOT[change.status]}
              label={CHANGE_STATUS_LABEL[change.status]}
              muted={change.status === "cerrado"}
            />
            <span className={cn("text-[12.5px]", RISK_TEXT[change.risk])}>
              Riesgo {CHANGE_RISK_LABEL[change.risk].toLowerCase()}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canImplement ? (
            <Button variant="primary" onClick={() => setChangeStatus(change.id, "implementado")}>
              Marcar implementado
            </Button>
          ) : null}
          {canClose ? (
            <Button variant="ghost" onClick={() => setChangeStatus(change.id, "cerrado")}>
              Cerrar cambio
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section aria-label="Descripción">
            <h2 className="label text-ink-2">Descripción</h2>
            <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
              {change.description}
            </p>
          </section>

          <section aria-label="Aprobaciones CAB">
            <h2 className="label text-ink-2">
              Aprobaciones {change.type === "emergencia" ? "ECAB" : "CAB"}
            </h2>
            <ul className="mt-2 overflow-hidden rounded-[3px] border border-rule">
              {change.approvals.map((a) => (
                <li
                  key={a.role}
                  className="flex flex-wrap items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0"
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", APPROVAL_DOT[a.state])}
                  />
                  <span className="min-w-0 flex-1 text-[13.5px] text-ink-2">{a.role}</span>
                  <span
                    className={cn(
                      "text-[12.5px]",
                      a.state === "aprobado"
                        ? "text-good"
                        : a.state === "rechazado"
                          ? "text-signal"
                          : "text-ink-3",
                    )}
                  >
                    {APPROVAL_STATE_LABEL[a.state]}
                  </span>
                  {canVote && a.state === "pendiente" ? (
                    <span className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeDecision(change.id, a.role, true)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeDecision(change.id, a.role, false)}
                      >
                        Rechazar
                      </Button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {change.status === "rechazado" ? (
              <p className="mt-3 text-[13px] text-ink-3">
                Cambio rechazado por el CAB. Reabre el proceso con una nueva
                solicitud que resuelva las objeciones documentadas.
              </p>
            ) : null}
          </section>

          <section aria-label="Elementos afectados">
            <h2 className="label text-ink-2">Elementos de configuración afectados</h2>
            {ciNames.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-3">Sin CIs afectados declarados.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {ciNames.map((ci) => (
                  <li key={ci.id}>
                    <Link
                      to="/cmdb"
                      className="inline-flex items-center gap-2 rounded-[3px] border border-rule px-3 py-1.5 text-[13px] text-ink-2 transition-colors duration-150 hover:border-ink hover:text-ink"
                    >
                      <span className="font-mono text-[11.5px] text-ink-3">{ci.id}</span>
                      {ci.name.split(" — ")[0]}
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
              <Propiedad label="Tipo">{CHANGE_TYPE_LABEL[change.type]}</Propiedad>
              <Propiedad label="Riesgo">{CHANGE_RISK_LABEL[change.risk]}</Propiedad>
              <Propiedad label="Ventana">
                <span className="font-mono text-[12px]">{change.ventana}</span>
              </Propiedad>
              <Propiedad label="Solicita">{change.solicita}</Propiedad>
              <Propiedad label="Implementador">
                {change.implementador ?? "Sin asignar"}
              </Propiedad>
              <Propiedad label="Actualizado">{fmtRelative(change.updatedAt, now)}</Propiedad>
            </dl>
          </Module>
          {change.type === "emergencia" ? (
            <p className="flex items-start gap-2 rounded-[3px] border border-rule bg-raised px-4 py-3 text-[13px] text-ink-2">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
              Cambio de emergencia: la aprobación verbal del ECAB debe quedar
              documentada en la solicitud dentro de las siguientes 24 horas.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
