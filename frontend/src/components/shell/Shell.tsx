import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { LogoLockup } from "../../brand/Logo";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../lib/auth";
import { useStore } from "../../lib/store";
import { OPEN_STATUSES } from "../../lib/types";
import { NotificationsBell } from "./Notifications";
import { ThemeToggle } from "./ThemeToggle";

const ICONS = {
  dashboard: LayoutDashboard,
  incidente: AlertCircle,
  requerimiento: ClipboardList,
  problema: Search,
  cambio: ArrowLeftRight,
  cmdb: Database,
  kb: BookOpen,
  reportes: BarChart3,
  config: Settings,
} as const;

type RailIcon = keyof typeof ICONS;

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const navigate = useNavigate();
  const { user, live, logout } = useAuth();
  const name = user?.name ?? "Jorge Ramos";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-rule bg-paper px-3 md:gap-4 md:px-5">
      <Link to="/" aria-label="TickITFlow — inicio" className="rounded-xl">
        <LogoLockup />
      </Link>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Buscar (abre la paleta de comandos)"
        className="ml-2 hidden h-9 w-80 cursor-pointer items-center gap-2 rounded-xl border border-rule bg-raised px-3 text-left text-[13px] text-ink-3 transition-colors duration-150 hover:border-ink md:flex"
      >
        <Search size={14} strokeWidth={1.75} aria-hidden />
        Buscar tickets, acciones…
        <kbd className="ml-auto rounded-md border border-rule px-1.5 py-0.5 font-mono text-[11px] text-ink-3">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Buscar (abre la paleta de comandos)"
        className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-rule bg-raised text-ink-2 transition-colors duration-150 hover:border-ink md:hidden"
      >
        <Search size={15} strokeWidth={1.75} aria-hidden />
      </button>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Button
          variant="primary"
          size="sm"
          className="h-9 px-3"
          onClick={() => navigate("/nuevo?practice=incidente")}
        >
          Nuevo incidente
        </Button>
        <span
          title={
            live
              ? "Todo el contenido viene en vivo de los microservicios, con datos sembrados de demostración."
              : "Todos los datos de esta consola son sintéticos, para demostración."
          }
          className="label rounded-xl border border-rule px-2 py-1 text-ink-3"
        >
          {live ? "Datos en vivo" : "Datos demo"}
        </span>
        <span className="hidden h-5 w-px bg-rule lg:block" aria-hidden />
        <ThemeToggle />
        <NotificationsBell />
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-xl bg-ink text-[11px] font-semibold text-paper"
          >
            {initials}
          </span>
          <span className="hidden text-[13px] text-ink-2 lg:inline">{name}</span>
        </span>
        {live ? (
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-ink-3 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
          >
            <LogOut size={15} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </header>
  );
}

function RailLink({
  to,
  label,
  icon,
  countKey,
}: {
  to: string;
  label: string;
  icon: RailIcon;
  countKey?: CountKey;
}) {
  const { pathname } = useLocation();
  const { tickets, problems, changes, cis, articles } = useStore();
  const Icon = ICONS[icon];
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  let openCount: number | null = null;
  if (countKey === "incidente" || countKey === "requerimiento") {
    openCount = tickets.filter(
      (t) => t.practice === countKey && OPEN_STATUSES.includes(t.status),
    ).length;
  } else if (countKey === "problemas") {
    openCount = problems.filter(
      (p) => p.status === "nuevo" || p.status === "investigacion",
    ).length;
  } else if (countKey === "cambios") {
    openCount = changes.filter((c) => c.status === "en_revision").length;
  } else if (countKey === "cmdb") {
    openCount = cis.length;
  } else if (countKey === "kb") {
    openCount = articles.length;
  }

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] transition-colors duration-150",
        active
          ? "bg-amber-fill font-bold text-amber-fill-ink"
          : "text-ink-2 hover:bg-row-hover",
      )}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      {label}
      {openCount !== null && (
        <span
          className={cn(
            "ml-auto font-mono text-[11px] tabular-nums",
            active ? "text-amber-fill-ink/80" : "text-ink-3",
          )}
        >
          {openCount}
        </span>
      )}
    </Link>
  );
}

type CountKey =
  | "incidente"
  | "requerimiento"
  | "problemas"
  | "cambios"
  | "cmdb"
  | "kb";

export function PracticeRail() {
  const { live } = useStore();
  return (
    <nav
      aria-label="Prácticas"
      className="hidden w-56 shrink-0 border-r border-rule bg-paper md:block"
    >
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="label mb-2 px-2 text-ink-3">Operar</p>
          <ul className="space-y-0.5">
            <li>
              <RailLink to="/" label="Dashboard" icon="dashboard" />
            </li>
            <li>
              <RailLink
                to="/cola/incidente"
                label="Incidentes"
                icon="incidente"
                countKey="incidente"
              />
            </li>
            <li>
              <RailLink
                to="/cola/requerimiento"
                label="Requerimientos"
                icon="requerimiento"
                countKey="requerimiento"
              />
            </li>
            <li>
              <RailLink to="/reportes" label="Reportes" icon="reportes" />
            </li>
            <li>
              <RailLink to="/configuracion" label="Configuración" icon="config" />
            </li>
          </ul>

          <p className="label mt-6 mb-2 px-2 text-ink-3">Prácticas ITIL</p>
          <ul className="space-y-0.5">
            <li>
              <RailLink
                to="/problemas"
                label="Problemas"
                icon="problema"
                countKey="problemas"
              />
            </li>
            <li>
              <RailLink
                to="/cambios"
                label="Cambios"
                icon="cambio"
                countKey="cambios"
              />
            </li>
            <li>
              <RailLink to="/cmdb" label="CMDB" icon="cmdb" countKey="cmdb" />
            </li>
            <li>
              <RailLink to="/kb" label="Base de conocimiento" icon="kb" countKey="kb" />
            </li>
          </ul>
        </div>
        <div className="border-t border-rule px-4 py-3">
          <p className="font-mono text-[11px] text-ink-3">TickITFlow v0.1</p>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-3">
            {live
              ? "Contenido en vivo de los microservicios; datos sembrados de demostración."
              : "Datos sintéticos de demostración."}
          </p>
        </div>
      </div>
    </nav>
  );
}
