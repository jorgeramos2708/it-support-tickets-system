import { useEffect, useState } from "react";
import { Save, Send, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Field, Segmented, TextInput } from "../components/ui/Field";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface SmtpState {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  enabled: boolean;
  recipients: string;
}

const EMPTY: SmtpState = {
  host: "",
  port: "587",
  user: "",
  pass: "",
  from: "tickitflow@edrs.xyz",
  secure: false,
  enabled: false,
  recipients: "",
};

export function ConfiguracionView() {
  const { token, user } = useAuth();
  const [smtp, setSmtp] = useState<SmtpState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getSmtpSettings(token)
      .then((res) => {
        setSmtp({
          host: res.smtp.host,
          port: String(res.smtp.port),
          user: res.smtp.user,
          pass: res.smtp.pass ?? "",
          from: res.smtp.from,
          secure: res.smtp.secure,
          enabled: res.smtp.enabled,
          recipients: res.smtp.recipients.join(", "),
        });
      })
      .catch((err) => console.error("[settings]", err))
      .finally(() => setLoading(false));
  }, [token]);

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-rule bg-raised px-6 py-10 text-center">
        <ShieldCheck size={22} strokeWidth={1.5} className="mx-auto text-ink-3" />
        <p className="mt-2 text-[15px] font-medium text-ink">
          Solo administradores pueden gestionar la configuración
        </p>
      </div>
    );
  }

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.updateSmtpSettings(token, {
        host: smtp.host,
        port: Number(smtp.port) || 587,
        user: smtp.user,
        ...(smtp.pass && smtp.pass !== "••••••••" ? { pass: smtp.pass } : {}),
        from: smtp.from,
        secure: smtp.secure,
        enabled: smtp.enabled,
        recipients: smtp.recipients
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      setMessage("Configuración guardada");
      setIsError(false);
    } catch {
      setMessage("Error al guardar la configuración");
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (!token) return;
    setMessage("Enviando email de prueba…");
    try {
      const res = await api.testSmtp(token);
      setMessage(res.message);
      setIsError(!res.sent);
    } catch {
      setMessage("Fallo al enviar el email de prueba");
      setIsError(true);
    }
  };

  const set = (key: keyof SmtpState, value: string | boolean) =>
    setSmtp((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return <p className="text-center text-[13px] text-ink-3">Cargando configuración…</p>;
  }

  return (
    <div className="mx-auto max-w-[720px] animate-rise">
      <h1 className="font-display text-[30px] leading-[1.2] font-extrabold tracking-tight">
        Configuración
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-3">
        Servidor de correo para notificaciones críticas de TickITFlow.
      </p>

      <section className="mt-6 rounded-xl border border-rule bg-raised">
        <header className="flex items-center gap-2 border-b border-rule px-5 py-3">
          <h2 className="label text-ink-2">Servidor SMTP</h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[13px] text-ink-3">Activo</span>
            <Segmented
              name="smtp-enabled"
              value={smtp.enabled ? "si" : "no"}
              onChange={(v) => set("enabled", v === "si")}
              options={[
                { value: "si" as const, label: "Sí" },
                { value: "no" as const, label: "No" },
              ]}
            />
          </div>
        </header>
        <div className="space-y-5 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Servidor" htmlFor="smtp-host">
              <TextInput
                id="smtp-host"
                value={smtp.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </Field>
            <Field label="Puerto" htmlFor="smtp-port">
              <TextInput
                id="smtp-port"
                type="number"
                value={smtp.port}
                onChange={(e) => set("port", e.target.value)}
                placeholder="587"
              />
            </Field>
            <Field label="Seguridad" htmlFor="smtp-secure">
              <div className="pt-1.5">
                <Segmented
                  name="smtp-secure"
                  value={smtp.secure ? "tls" : "starttls"}
                  onChange={(v) => set("secure", v === "tls")}
                  options={[
                    { value: "starttls" as const, label: "STARTTLS" },
                    { value: "tls" as const, label: "SSL/TLS" },
                  ]}
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Usuario" htmlFor="smtp-user">
              <TextInput
                id="smtp-user"
                value={smtp.user}
                onChange={(e) => set("user", e.target.value)}
                placeholder="usuario@dominio.com"
              />
            </Field>
            <Field label="Contraseña" htmlFor="smtp-pass" hint="Se enmascara al guardar. Deja el campo enmascarado sin cambiar para conservar la actual.">
              <TextInput
                id="smtp-pass"
                type="password"
                value={smtp.pass}
                onChange={(e) => set("pass", e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>

          <Field
            label="Remitente"
            htmlFor="smtp-from"
            hint="Dirección que aparece como From en los emails."
          >
            <TextInput
              id="smtp-from"
              value={smtp.from}
              onChange={(e) => set("from", e.target.value)}
              placeholder="tickitflow@edrs.xyz"
            />
          </Field>

          <Field
            label="Destinatarios"
            htmlFor="smtp-recipients"
            hint="Separados por comas. Reciben notificaciones de tickets P1, problemas, cambios aprobados/rechazados."
          >
            <TextInput
              id="smtp-recipients"
              value={smtp.recipients}
              onChange={(e) => set("recipients", e.target.value)}
              placeholder="admin@edrs.xyz, soporte@edrs.xyz"
            />
          </Field>
        </div>
        <footer className="flex items-center gap-3 border-t border-rule px-5 py-3">
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            <Save size={14} strokeWidth={1.75} aria-hidden />
            {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
          <Button variant="outline" size="sm" onClick={test}>
            <Send size={14} strokeWidth={1.75} aria-hidden />
            Probar email
          </Button>
          {message ? (
            <p className={`text-[13px] ${isError ? "text-signal" : "text-good"}`}>
              {message}
            </p>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
