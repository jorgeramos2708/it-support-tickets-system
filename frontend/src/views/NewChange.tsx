import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, Segmented, TextArea, TextInput } from "../components/ui/Field";
import { useStore } from "../lib/store";
import {
  approvalsForChangeType,
  CHANGE_RISK_LABEL,
  CHANGE_STATUS_LABEL,
  CHANGE_TYPE_LABEL,
  type ChangeRisk,
  type ChangeType,
} from "../lib/types";

function parseCis(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^CI-\d+$/.test(c));
}

export function NewChange() {
  const navigate = useNavigate();
  const { createChange, me } = useStore();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ChangeType>("normal");
  const [risk, setRisk] = useState<ChangeRisk>("medio");
  const [ventana, setVentana] = useState("");
  const [description, setDescription] = useState("");
  const [solicita, setSolicita] = useState(me);
  const [cis, setCis] = useState("");
  const [titleError, setTitleError] = useState(false);

  const ciIds = parseCis(cis);
  const approvals = approvalsForChangeType(type);
  const status = type === "estandar" ? "aprobado" : "en_revision";

  const submit = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    const change = await createChange({
      title: title.trim(),
      type,
      risk,
      ventana: ventana.trim() || "Por programar",
      description: description.trim() || "Sin descripción adicional.",
      solicita: solicita.trim() || me,
      ciIds,
    });
    navigate(`/cambios/${change.id}`);
  };

  return (
    <div className="mx-auto max-w-[760px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to="/cambios"
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          Cambios
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="text-ink-3">Nuevo</span>
      </nav>

      <h1 className="mt-3 font-display text-[34px] leading-[1.1] font-extrabold tracking-tight">
        Nuevo cambio
      </h1>
      <p className="mt-1.5 max-w-[62ch] text-[13.5px] text-ink-3">
        El tipo define el flujo: normal pasa por el CAB completo, el estándar
        está pre-aprobado y el de emergencia va directo al ECAB.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Título" htmlFor="ch-titulo">
          <TextInput
            id="ch-titulo"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(false);
            }}
            placeholder="p. ej. Actualización de firmware del switch núcleo"
            aria-invalid={titleError}
            className={titleError ? "border-signal" : ""}
          />
          {titleError ? (
            <p role="alert" className="text-[12.5px] text-signal">
              El cambio necesita un título claro para el CAB.
            </p>
          ) : null}
        </Field>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-32 text-[13px] text-ink-2">Tipo</span>
            <Segmented
              name="Tipo"
              value={type}
              onChange={(v) => setType(v)}
              options={(["normal", "estandar", "emergencia"] as ChangeType[]).map(
                (v) => ({ value: v, label: CHANGE_TYPE_LABEL[v] }),
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-32 text-[13px] text-ink-2">Riesgo</span>
            <Segmented
              name="Riesgo"
              value={risk}
              onChange={(v) => setRisk(v)}
              options={(["bajo", "medio", "alto"] as ChangeRisk[]).map((v) => ({
                value: v,
                label: CHANGE_RISK_LABEL[v],
              }))}
            />
          </div>
        </div>

        <Field label="Ventana de implementación" htmlFor="ch-ventana">
          <TextInput
            id="ch-ventana"
            value={ventana}
            onChange={(e) => setVentana(e.target.value)}
            placeholder="p. ej. Viernes 22:00 – 23:30 · Inmediata · Emergencia — hoy 14:00"
          />
        </Field>

        <Field label="Descripción" htmlFor="ch-desc">
          <TextArea
            id="ch-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Alcance, plan de reversión, afectación esperada, comunicación a usuarios…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Solicita" htmlFor="ch-solicita">
            <TextInput
              id="ch-solicita"
              value={solicita}
              onChange={(e) => setSolicita(e.target.value)}
            />
          </Field>
          <Field
            label="CIs afectados"
            htmlFor="ch-cis"
            hint={
              ciIds.length
                ? `Se declararán ${ciIds.length}: ${ciIds.join(", ")}`
                : "IDs separados por comas, p. ej. CI-1008 — opcional"
            }
          >
            <TextInput
              id="ch-cis"
              value={cis}
              onChange={(e) => setCis(e.target.value)}
              placeholder="CI-1008, CI-1009"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-rule bg-raised px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="label text-ink-3">Flujo de aprobación</span>
              <span className="text-[13px] text-ink-2">
                {approvals.map((a) => a.role).join(" → ")}
              </span>
            </div>
            <span className="text-[13px] text-ink-2">
              Estado inicial:{" "}
              <span className="font-medium">{CHANGE_STATUS_LABEL[status]}</span>
            </span>
          </div>
          {type === "estandar" ? (
            <p className="mt-2 text-[12.5px] text-ink-3">
              Cambio estándar pre-aprobado: queda listo para implementación sin
              pasar por el CAB.
            </p>
          ) : null}
          {type === "emergencia" ? (
            <p className="mt-2 text-[12.5px] text-ink-3">
              La aprobación verbal del ECAB debe quedar documentada en las
              siguientes 24 horas.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button variant="primary" type="submit">
            Registrar cambio
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
