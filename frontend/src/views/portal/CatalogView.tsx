import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CATALOG_CATEGORIES, CATALOG_ITEMS, PORTAL_USER } from "../../lib/data";
import { useStore } from "../../lib/store";
import { fmtRelative } from "../../lib/sla";

export function CatalogView() {
  const { articles, now } = useStore();
  const topArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] leading-[1.1] font-extrabold tracking-tight">
            ¿En qué te ayudamos, {PORTAL_USER.name.split(" ")[0].replace(".", "")}?
          </h1>
          <p className="mt-1 max-w-[62ch] text-[13.5px] text-ink-3">
            Solicita algo del catálogo o reporta algo que no funciona. Cada
            solicitud queda registrada con su número y su objetivo de atención.
          </p>
        </div>
      </div>

      <section
        aria-label="Reportar un problema"
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rule bg-raised px-6 py-5"
      >
        <div>
          <p className="text-[15px] font-semibold text-ink">
            ¿Algo no funciona como debería?
          </p>
          <p className="mt-1 text-[13px] text-ink-3">
            Repórtalo y el equipo de soporte lo atiende por prioridad.
          </p>
        </div>
        <Link to="/portal/incidente">
          <Button variant="primary">Reportar un problema</Button>
        </Link>
      </section>

      {CATALOG_CATEGORIES.map((category) => (
        <section key={category} className="mt-8" aria-label={category}>
          <h2 className="label text-ink-2">{category}</h2>
          <ul className="mt-2 overflow-hidden rounded-xl border border-rule">
            {CATALOG_ITEMS.filter((i) => i.category === category).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-4 py-3.5 first:border-t-0 hover:bg-raised"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-[11.5px] tabular-nums text-ink-3">
                      {item.id}
                    </span>
                    <span className="text-[14.5px] font-medium text-ink">
                      {item.name}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[64ch] text-[13px] text-ink-3">
                    {item.description}
                  </p>
                </div>
                <span className="font-mono text-[12px] tabular-nums text-ink-2">
                  ~{item.estimate}
                </span>
                <Link to={`/portal/solicitud/${item.id}`}>
                  <Button variant="outline" size="sm">
                    Solicitar
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-10" aria-label="Ayuda rápida">
        <div className="flex items-center gap-2">
          <h2 className="label text-ink-2">Antes de abrir un ticket</h2>
          <Link
            to="/portal/ayuda"
            className="text-[12.5px] link-grow hover:link-grow-hover font-bold text-amber hover:text-amber-hi"
          >
            Ver toda la ayuda
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {topArticles.map((a) => (
            <li key={a.id}>
              <Link
                to={`/portal/ayuda/${a.id}`}
                className="flex h-full flex-col justify-between gap-2 rounded-xl border border-rule px-4 py-3.5 transition-colors duration-150 hover:border-ink"
              >
                <span className="text-[14px] font-medium text-ink">{a.title}</span>
                <span className="flex items-center justify-between text-[12px] text-ink-3">
                  {fmtRelative(a.updatedAt, now)}
                  <ArrowRight size={13} strokeWidth={1.75} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
