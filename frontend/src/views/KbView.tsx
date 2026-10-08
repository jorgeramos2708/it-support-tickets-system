import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ThumbsUp } from "lucide-react";
import { Button } from "../components/ui/Button";
import { PracticeBadge } from "../components/ui/Chips";
import { cn } from "../lib/cn";
import { fmtRelative } from "../lib/sla";
import { useStore } from "../lib/store";
import { PRACTICE_LABEL, type PracticeAll } from "../lib/types";

const PRACTICE_FILTERS: (PracticeAll | "todas")[] = [
  "todas",
  "incidente",
  "requerimiento",
];

export function KbView({ basePath = "/kb" }: { basePath?: string }) {
  const { articles, now } = useStore();
  const [query, setQuery] = useState("");
  const [practice, setPractice] = useState<PracticeAll | "todas">("todas");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles
      .filter((a) => {
        if (practice !== "todas" && a.practice !== practice) return false;
        if (q && !`${a.id} ${a.title} ${a.summary}`.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [articles, practice, query]);

  return (
    <div className="mx-auto max-w-[900px] animate-rise">
      <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight">
        Base de conocimiento
      </h1>
      <p className="mt-1 text-[13px] text-ink-3">
        Soluciones documentadas por el equipo ·{" "}
        <span className="font-mono tabular-nums">{articles.length} artículos</span>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {PRACTICE_FILTERS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={practice === p}
            onClick={() => setPractice(p)}
            className={cn(
              "h-7 cursor-pointer rounded-[3px] border px-2.5 text-[12px] transition-colors duration-150",
              practice === p
                ? "border-ink bg-ink text-paper"
                : "border-rule text-ink-2 hover:border-ink",
            )}
          >
            {p === "todas" ? "Todas" : `${PRACTICE_LABEL[p]}s`}
          </button>
        ))}
        <div className="ml-auto w-72">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la base de conocimiento"
            aria-label="Buscar artículos"
            className="h-9 w-full rounded-[3px] border border-rule bg-raised px-3 text-sm text-ink transition-colors duration-150 placeholder:text-ink-3 focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <ul className="mt-4 overflow-hidden rounded-[3px] border border-rule">
        {filtered.map((a) => (
          <li key={a.id}>
            <Link
              to={`${basePath}/${a.id}`}
              className="block border-t border-rule px-4 py-3.5 transition-colors duration-150 first:border-t-0 hover:bg-raised"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[12px] tabular-nums text-ink-3">
                  {a.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">
                  {a.title}
                </span>
                <PracticeBadge practice={a.practice} />
                <span className="font-mono text-[11px] tabular-nums text-ink-3">
                  {a.views} vistas
                </span>
              </div>
              <p className="mt-1 max-w-[70ch] truncate text-[13px] text-ink-3">
                {a.summary}
              </p>
              <p className="mt-1 text-[11.5px] text-ink-3">
                Actualizado {fmtRelative(a.updatedAt, now)}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="border-t border-rule px-4 py-10 text-center first:border-t-0">
            <p className="text-[14px] font-medium text-ink">
              Sin artículos para esta vista
            </p>
            <p className="mt-1 text-[13px] text-ink-3">
              Prueba con otra palabra o revisa toda la base.
            </p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function KbArticleView({ basePath = "/kb" }: { basePath?: string }) {
  const { id } = useParams<{ id: string }>();
  const { articles, now, markArticleHelpful } = useStore();
  const navigate = useNavigate();
  const [voted, setVoted] = useState(false);

  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-[3px] border border-dashed border-rule-2 bg-raised px-6 py-16 text-center">
        <p className="text-[15px] font-medium text-ink">Artículo no encontrado</p>
        <p className="text-[13px] text-ink-3">
          El identificador no corresponde a ningún artículo de la base.
        </p>
        <Button variant="outline" className="mt-2" onClick={() => navigate(basePath)}>
          Volver a la base de conocimiento
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[820px] animate-rise">
      <nav aria-label="Ruta" className="flex items-center gap-2 text-[13px]">
        <Link
          to={basePath}
          className="text-ink underline decoration-rule-2 underline-offset-[3px] transition-colors duration-150 hover:decoration-ink"
        >
          Base de conocimiento
        </Link>
        <span aria-hidden className="text-ink-3">/</span>
        <span className="font-mono text-[12.5px] tabular-nums text-ink-3">
          {article.id}
        </span>
      </nav>

      <header className="mt-4">
        <h1 className="font-display text-[24px] leading-tight font-semibold tracking-tight">
          {article.title}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[13px] text-ink-3">
          <PracticeBadge practice={article.practice} />
          <span>
            Actualizado <span className="tabular-nums">{fmtRelative(article.updatedAt, now)}</span>
          </span>
          <span className="font-mono text-[11.5px] tabular-nums">
            {article.views} vistas
          </span>
        </div>
        <p className="mt-3 max-w-[66ch] text-[15px] leading-relaxed text-ink-2">
          {article.summary}
        </p>
      </header>

      <div className="mt-6 divide-y divide-rule border-t border-rule">
        {article.sections.map((s) => (
          <section key={s.heading} className="py-5">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              {s.heading}
            </h2>
            <p className="mt-2 max-w-[66ch] text-[15px] leading-[1.7] text-ink-2">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-rule bg-raised px-5 py-4">
        <p className="text-[13px] text-ink-2">
          <span className="font-mono tabular-nums">{article.helpful}</span> de{" "}
          <span className="font-mono tabular-nums">{article.views}</span> personas
          encontraron útil este artículo
          {voted ? " — gracias por tu calificación" : ""}.
        </p>
        <Button
          variant={voted ? "outline" : "secondary"}
          size="sm"
          disabled={voted}
          onClick={() => {
            markArticleHelpful(article.id);
            setVoted(true);
          }}
        >
          <ThumbsUp size={13} strokeWidth={1.75} aria-hidden />
          {voted ? "Calificado" : "¿Te ayudó?"}
        </Button>
      </footer>
    </article>
  );
}
