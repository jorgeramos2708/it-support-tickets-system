import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, Segmented, TextArea, TextInput } from "../components/ui/Field";
import { useStore } from "../lib/store";

function parseCodes(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^(INC|REQ)-\d+$/.test(c));
}

export function NewProblem() {
  const navigate = useNavigate();
  const { createProblem } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidents, setIncidents] = useState("");
  const [workaround, setWorkaround] = useState<"no" | "si">("no");
  const [titleError, setTitleError] = useState(false);

  const linked = parseCodes(incidents);

  const submit = async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    const problem = await createProblem({
      title: title.trim(),
      description: description.trim() || "Sin descripción adicional.",
      linkedIncidentIds: linked,
      workaround: workaround === "si",
    });
    navigate(`/problemas/${problem.id}`);
  };

  return (
    <div className="mx-auto max-w-[760px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to="/problemas"
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          Problemas
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="text-ink-3">Nuevo</span>
      </nav>

      <h1 className="mt-3 font-display text-[26px] leading-tight font-semibold tracking-tight">
        Nuevo problema
      </h1>
      <p className="mt-1.5 max-w-[62ch] text-[13.5px] text-ink-3">
        Un problema agrupa la causa raíz de incidentes recurrentes. Se registra
        en estado Nuevo y entra a investigación al tomarlo.
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Título" htmlFor="pr-titulo">
          <TextInput
            id="pr-titulo"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(false);
            }}
            placeholder="p. ej. Bloqueos recurrentes de cuentas de dominio"
            aria-invalid={titleError}
            className={titleError ? "border-signal" : ""}
          />
          {titleError ? (
            <p role="alert" className="text-[12.5px] text-signal">
              El problema necesita un título que lo distinga de un incidente.
            </p>
          ) : null}
        </Field>

        <Field label="Descripción" htmlFor="pr-desc">
          <TextArea
            id="pr-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Patrón observado, área afectada, frecuencia, hipótesis inicial…"
          />
        </Field>

        <Field
          label="Incidentes ligados"
          htmlFor="pr-inc"
          hint={
            linked.length
              ? `Se ligarán ${linked.length} ${linked.length === 1 ? "incidente" : "incidentes"}: ${linked.join(", ")}`
              : "IDs separados por comas, p. ej. INC-2401, INC-2407 — opcional"
          }
        >
          <TextInput
            id="pr-inc"
            value={incidents}
            onChange={(e) => setIncidents(e.target.value)}
            placeholder="INC-2401, INC-2407"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-ink-2">Workaround temporal</span>
          <Segmented
            name="Workaround"
            value={workaround}
            onChange={(v) => setWorkaround(v)}
            options={[
              { value: "no" as const, label: "Sin workaround" },
              { value: "si" as const, label: "Con workaround" },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-rule bg-raised px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="label text-ink-3">Se registrará</span>
            <span className="font-mono text-[12.5px] text-ink-2">PRB-30XX</span>
            <span className="text-[13px] text-ink-2">en estado Nuevo</span>
          </div>
          {workaround === "si" ? (
            <p className="text-[13px] text-ink-3">
              El workaround se documenta, pero no cierra la investigación.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button variant="primary" type="submit">
            Registrar problema
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
