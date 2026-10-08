import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("settings")
@Unique("UQ_key", ["key"])
export class SettingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Clave de configuración (ej: smtp.host, smtp.port, notify.emails) */
  @Column({ unique: true })
  key!: string;

  /** Valor como string (JSON serializado para tipos complejos) */
  @Column({ type: "text" })
  value!: string;

  @Column({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;
}

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  enabled: boolean;
  recipients: string[];
}

export const DEFAULT_SMTP: SmtpSettings = {
  host: "",
  port: 587,
  user: "",
  pass: "",
  from: "tickitflow@edrs.xyz",
  secure: false,
  enabled: false,
  recipients: [],
};

export function smtpSettingsFromEnv(): SmtpSettings {
  return {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "tickitflow@edrs.xyz",
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    enabled: Boolean(process.env.SMTP_HOST),
    recipients: (process.env.NOTIFY_EMAIL_TO ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  };
}

export function smtpSettingsFromRows(rows: SettingEntity[]): SmtpSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const env = smtpSettingsFromEnv();
  const get = (key: string, fallback: string) => map.get(key) ?? fallback;
  return {
    host: get("smtp.host", env.host),
    port: Number(get("smtp.port", String(env.port))) || 587,
    user: get("smtp.user", env.user),
    pass: get("smtp.pass", env.pass),
    from: get("smtp.from", env.from),
    secure: get("smtp.secure", String(env.secure)) === "true",
    enabled: get("smtp.enabled", String(env.enabled)) === "true",
    recipients: get("notify.emails", env.recipients.join(","))
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
  };
}

export function maskSmtpSettings(s: SmtpSettings): SmtpSettings & {
  pass: string | null;
} {
  return {
    ...s,
    pass: s.pass ? "••••••••" : "",
  };
}
