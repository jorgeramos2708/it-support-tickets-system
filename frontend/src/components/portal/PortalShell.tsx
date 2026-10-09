import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { LogoLockup } from "../../brand/Logo";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../lib/auth";
import { NotificationsBell } from "../shell/Notifications";
import { ThemeToggle } from "../shell/ThemeToggle";

function PortalNavLink({
  to,
  label,
  exact = false,
}: {
  to: string;
  label: string;
  exact?: boolean;
}) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-xl px-3 py-1.5 text-[13px] transition-colors duration-150",
        active
          ? "bg-ink font-medium text-paper"
          : "text-ink-2 hover:bg-ink/5",
      )}
    >
      {label}
    </Link>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, live, logout } = useAuth();
  const name = live && user ? user.name : "M. Aguilar";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-paper px-4 md:px-6">
        <Link to="/portal" aria-label="TickITFlow — portal de autoservicio" className="rounded-xl">
          <LogoLockup />
        </Link>
        <nav aria-label="Portal" className="ml-4 hidden items-center gap-1 sm:flex">
          <PortalNavLink to="/portal" label="Catálogo" exact />
          <PortalNavLink to="/portal/mis-tickets" label="Mis tickets" />
          <PortalNavLink to="/portal/ayuda" label="Ayuda" />
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Button
            variant="primary"
            size="sm"
            className="h-9 px-3"
            onClick={() => navigate("/portal/incidente")}
          >
            Reportar problema
          </Button>
          <span
            title={
              live
                ? "Tus tickets vienen en vivo del servidor, con datos sembrados de demostración."
                : "Todos los datos de este portal son sintéticos, para demostración."
            }
            className="label hidden rounded-xl border border-rule px-2 py-1 text-ink-3 sm:inline-block"
          >
            {live ? "Datos en vivo" : "Datos demo"}
          </span>
          <span className="hidden h-5 w-px bg-rule sm:block" aria-hidden />
          <ThemeToggle />
          <NotificationsBell />
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-xl bg-ink text-[11px] font-semibold text-paper"
            >
              {initials}
            </span>
            <span className="hidden text-[13px] text-ink-2 lg:inline">
              {live && user ? `${name} · ${user.email}` : "M. Aguilar · Finanzas"}
            </span>
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

      <main className="mx-auto w-full max-w-[980px] flex-1 px-5 py-8 md:px-8 md:py-10">
        {children}
      </main>

      <footer className="border-t border-rule px-6 py-4">
        <p className="mx-auto max-w-[980px] text-[12px] text-ink-3">
          TickITFlow — Portal de autoservicio de TI ·{" "}
          <span className="font-mono text-[11px]">v0.1</span> · Datos sintéticos
          de demostración ·{" "}
          <Link
            to="/landing"
            className="text-ink underline decoration-rule-2 underline-offset-[3px] hover:decoration-ink"
          >
            presentación
          </Link>{" "}
          · Consola de agentes:{" "}
          <Link
            to="/"
            className="text-ink underline decoration-rule-2 underline-offset-[3px] hover:decoration-ink"
          >
            entrar
          </Link>
        </p>
      </footer>
    </div>
  );
}
