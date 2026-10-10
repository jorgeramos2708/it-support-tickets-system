import { useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Paperclip, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PriorityChip } from "../../components/ui/Chips";
import { Field, Segmented, TextArea, TextInput } from "../../components/ui/Field";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { CATALOG_ITEMS, PORTAL_USER } from "../../lib/data";
import { SLA_TARGET_LABEL, priorityOf } from "../../lib/sla";
import { useStore } from "../../lib/store";
import {
  type Impact,
  type Practice,
  type Urgency,
} from "../../lib/types";

const ALCANCE_OPTIONS: { value: Impact; label: string }[] = [
  { value: "bajo", label: "Solo a mí" },
  { value: "medio", label: "A mi equipo" },
  { value: "alto", label: "A toda la empresa" },
];

const URGENCIA_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

export function ReportIncidentView() {
  return <PortalForm mode="incidente" />;
}

export function CatalogRequestView() {
  const { itemId } = useParams<{ itemId: string }>();
  const item = CATALOG_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-rule-2 bg-raised px-6 py-14 text-center">
        <p className="text-[15px] font-medium text-ink">
          Servicio no encontrado
        </p>
        <p className="mt-1 text-[13px] text-ink-3">
          El elemento del catálogo no existe.
        </p>
        <Link to="/portal" className="mt-3 inline-block text-[13px] link-grow hover:link-grow-hover font-bold text-amber hover:text-amber-hi">
          Volver al catálogo
        </Link>
      </div>
    );
  }
  return <PortalForm mode="catalogo" item={item} />;
}

function PortalForm({
  mode,
  item,
}: {
  mode: "incidente" | "catalogo";
  item?: (typeof CATALOG_ITEMS)[number];
}) {
  const navigate = useNavigate();
  const { createTicket } = useStore();
  const practice: Practice = mode === "incidente" ? "incidente" : "requerimiento";
  const [subject, setSubject] = useState(item ? item.name : "");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<Impact>(item ? item.impact : "medio");
  const [urgency, setUrgency] = useState<Urgency>("media");
  const [subjectError, setSubjectError] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ name: string; sizeKb: number }>
  >([]);

  const priority = priorityOf(impact, urgency);
  const { token } = useAuth();
  const [fileObjects, setFileObjects] = useState<File[]>([]);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nextMeta = [...attachments];
    const nextFiles = [...fileObjects];
    for (const f of files) {
      if (nextMeta.length >= 5) break;
      nextMeta.push({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) });
      nextFiles.push(f);
    }
    setAttachments(nextMeta);
    setFileObjects(nextFiles);
    e.target.value = "";
  };

  const submit = async () => {
    if (!subject.trim()) {
      setSubjectError(true);
      return;
    }
    const ticket = await createTicket({
      practice,
      subject: subject.trim(),
      description: description.trim() || "Sin descripción adicional.",
      requester: PORTAL_USER.name,
      dept: PORTAL_USER.dept,
      priority,
      attachments,
    });

    // Subir archivos reales a MinIO (si estamos en modo live con token)
    if (token && fileObjects.length > 0) {
      for (const file of fileObjects) {
        try {
          await api.uploadAttachment(token, ticket.id, file);
        } catch (err) {
          console.error("[portal] upload falló:", file.name, err);
        }
      }
    }

    navigate(`/portal/ticket/${ticket.id}`, { state: { creado: true } });
  };

  return (
    <div className="mx-auto max-w-[720px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to="/portal"
          className="link-grow hover:link-grow-hover font-bold text-amber hover:text-amber-hi"
        >
          Catálogo
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="text-ink-3">
          {mode === "incidente" ? "Reportar problema" : item?.name}
        </span>
      </nav>

      <h1 className="mt-3 font-display text-[30px] leading-[1.2] font-extrabold tracking-tight">
        {mode === "incidente"
          ? "Reportar un problema"
          : `Solicitar: ${item?.name}`}
      </h1>
      <p className="mt-1.5 max-w-[62ch] text-[13.5px] text-ink-3">
        {mode === "incidente"
          ? "Cuéntanos qué falla y a quién afecta. Con eso calculamos la prioridad de atención."
          : item?.description}
      </p>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Asunto" htmlFor="p-asunto">
          <TextInput
            id="p-asunto"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (subjectError && e.target.value.trim()) setSubjectError(false);
            }}
            placeholder={
              mode === "incidente"
                ? "p. ej. No puedo entrar a la VPN desde casa"
                : "p. ej. Acceso a la carpeta de Finanzas"
            }
            aria-invalid={subjectError}
            className={subjectError ? "border-signal" : ""}
          />
          {subjectError ? (
            <p role="alert" className="text-[12.5px] text-signal">
              Cuéntanos el asunto en una línea para poder ayudarte.
            </p>
          ) : null}
        </Field>

        <Field label="Descripción" htmlFor="p-desc" hint="Los detalles ayudan a resolver sin llamadas de regreso.">
          <TextArea
            id="p-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              mode === "incidente"
                ? "¿Qué estaba haciendo cuando falló? ¿Apareció algún mensaje?"
                : "Detalle lo que necesitas: nombres, carpetas, fechas, autorizaciones…"
            }
          />
        </Field>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-32 text-[13px] text-ink-2">¿A quién afecta?</span>
            <Segmented
              name="Alcance"
              value={impact}
              onChange={(v) => setImpact(v)}
              options={ALCANCE_OPTIONS}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-32 text-[13px] text-ink-2">Urgencia</span>
            <Segmented
              name="Urgencia"
              value={urgency}
              onChange={(v) => setUrgency(v)}
              options={URGENCIA_OPTIONS}
            />
          </div>
        </div>

        <Field label="Adjuntos" htmlFor="p-adjuntos" hint="Hasta 5 archivos (capturas, PDFs). En modo demo solo se registra el nombre.">
          <div className="flex items-center gap-2">
            <label
              htmlFor="p-adjuntos"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-rule bg-raised px-3 text-sm text-ink-2 transition-colors duration-150 hover:border-ink"
            >
              <Paperclip size={14} strokeWidth={1.75} aria-hidden />
              Adjuntar archivos
            </label>
            <input
              id="p-adjuntos"
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            {attachments.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {attachments.map((a, i) => (
                  <span
                    key={`${a.name}-${i}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-rule bg-raised px-2 py-1 font-mono text-[11px] text-ink-2"
                  >
                    {a.name}
                    <span className="text-ink-3">({a.sizeKb} KB)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="cursor-pointer text-ink-3 transition-colors duration-150 hover:text-signal"
                      aria-label={`Quitar ${a.name}`}
                    >
                      <X size={11} strokeWidth={2} aria-hidden />
                    </button>
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-raised px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="label text-ink-3">Prioridad de atención</span>
            <PriorityChip priority={priority} full className="text-[13px]" />
          </div>
          <p className="text-[13px] text-ink-3">
            Objetivo de atención:{" "}
            <span className="font-mono tabular-nums text-ink-2">
              {SLA_TARGET_LABEL[priority]}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button variant="primary" type="submit">
            {mode === "incidente" ? "Enviar reporte" : "Enviar solicitud"}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <p className="ml-auto hidden text-[12px] text-ink-3 sm:block">
            Se registrará a nombre de {PORTAL_USER.name} y el equipo de
            soporte lo verá de inmediato.
          </p>
        </div>
      </form>
    </div>
  );
}
