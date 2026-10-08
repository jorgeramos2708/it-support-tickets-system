/** Exporta un array de objetos a CSV descargable en el navegador. */
export function exportCsv(
  filename: string,
  rows: Array<Record<string, string | number | null | undefined>>,
  headers?: string[],
): void {
  const cols = headers ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
  const escape = (v: string | number | null | undefined): string => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes(`"`) || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
