import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, Segmented, Select, TextArea, TextInput } from "../components/ui/Field";
import { PriorityChip } from "../components/ui/Chips";
import { DEPTS } from "../lib/data";
import { SLA_TARGET_LABEL, priorityOf } from "../lib/sla";
import { useStore } from "../lib/store";
import {
  IMPACT_LABEL,
  PRACTICE_LABEL,
  URGENCY_LABEL,
  type Impact,
  type Practice,
  type Urgency,
} from "../lib/types";

export function NewTicket() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { createTicket } = useStore();

  const [practice, setPractice] = useState<Practice>(
    params.get("practice") === "requerimiento" ? "requerimiento" : "incidente",
  );
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [dept, setDept] = useState(DEPTS[0]);
  const [impact, setImpact] = useState<Impact>("medio");
  const [urgency, setUrgency] = useState<Urgency>("media");
  const [subjectError, setSubjectError] = useState(false);

  const priority = priorityOf(impact, urgency);

  const submit = async () => {
    if (!subject.trim()) {
      setSubjectError(true);
      return;
    }
    const ticket = await createTicket({
      practice,
      subject: subject.trim(),
      description: description.trim() || "Sin descripción adicional.",
      requester: requester.trim() || "Consola de agentes",
      dept,
      priority,
      attachments: [],
    });
    navigate(`/ticket/${ticket.id}`);
  };

  return (
    <div className="mx-auto max-w-[760px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to={`/cola/${practice}`}
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          {PRACTICE_LABEL[practice]}s
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="text-ink-3">Nuevo</span>
      </nav>

      <h1 className="mt-3 font-display text-[34px] leading-[1.1] font-extrabold tracking-tight">
        Nuevo ticket
      </h1>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center gap-4">
          <span className="label text-ink-2">Práctica</span>
          <Segmented
            name="Práctica"
            value={practice}
            onChange={(v) => setPractice(v)}
            options={[
              { value: "incidente", label: PRACTICE_LABEL.incidente },
              { value: "requerimiento", label: PRACTICE_LABEL.requerimiento },
            ]}
          />
        </div>

        <Field label="Asunto" htmlFor="asunto">
          <TextInput
            id="asunto"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (subjectError && e.target.value.trim()) setSubjectError(false);
            }}
            placeholder={
              practice === "incidente"
                ? "p. ej. VPN no conecta desde la sucursal norte"
                : "p. ej. Alta de equipo para nuevo empleado"
            }
            aria-invalid={subjectError}
            className={subjectError ? "border-signal" : ""}
          />
          {subjectError ? (
            <p role="alert" className="text-[12.5px] text-signal">
              El asunto es obligatorio para registrar el ticket.
            </p>
          ) : null}
        </Field>

        <Field label="Descripción" htmlFor="descripcion">
          <TextArea
            id="descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Síntomas, pasos para reproducir, impacto en el usuario…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Solicitante" htmlFor="solicitante">
            <TextInput
              id="solicitante"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="Nombre de quien reporta"
            />
          </Field>
          <Field label="Departamento" htmlFor="departamento">
            <Select
              id="departamento"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              {DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset className="space-y-4">
          <legend className="label mb-1 text-ink-2">Clasificación ITIL</legend>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ink-2">Impacto</span>
              <Segmented
                name="Impacto"
                value={impact}
                onChange={(v) => setImpact(v)}
                options={(["alto", "medio", "bajo"] as Impact[]).map((v) => ({
                  value: v,
                  label: IMPACT_LABEL[v],
                }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ink-2">Urgencia</span>
              <Segmented
                name="Urgencia"
                value={urgency}
                onChange={(v) => setUrgency(v)}
                options={(["alta", "media", "baja"] as Urgency[]).map((v) => ({
                  value: v,
                  label: URGENCY_LABEL[v],
                }))}
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-raised px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="label text-ink-3">Prioridad calculada</span>
            <PriorityChip priority={priority} full className="text-[13px]" />
          </div>
          <p className="text-[13px] text-ink-3">
            Objetivo de resolución:{" "}
            <span className="font-mono tabular-nums text-ink-2">
              {SLA_TARGET_LABEL[priority]}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button variant="primary" type="submit">
            Registrar ticket
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <p className="ml-auto hidden text-[12px] text-ink-3 sm:block">
            La prioridad sigue la matriz ITIL de impacto × urgencia.
          </p>
        </div>
      </form>
    </div>
  );
}
