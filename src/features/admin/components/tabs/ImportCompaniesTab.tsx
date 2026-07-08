import { useMemo, useRef, useState } from "react";
import { Upload, FileWarning, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toastError } from "@/lib/safe";
import { useAuth } from "@/features/auth/use-auth";
import { logAdminAction } from "@/features/admin/functions/audit";
import { parseCsv, mapHeaders, type CsvHeader } from "@/features/admin/functions/csv";
import { Empty } from "../admin-ui";

type ParsedRow = {
  index: number;
  data: Partial<Record<CsvHeader, string>>;
  errors: string[];
};

const TEMPLATE =
  "nome,descricao,categoria,cidade,bairro,endereco,numero,cep,telefone,whatsapp,email,site,instagram,facebook\n" +
  "Exemplo Restaurante,Comida caseira e ambiente familiar,restaurantes,São Paulo,Centro,Rua das Flores,100,37550-000,(35) 3421-0000,(35) 99999-0000,contato@exemplo.com,https://exemplo.com,https://instagram.com/exemplo,\n";

function downloadTemplate() {
  const blob = new Blob(["\ufeff" + TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-empresas.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ImportCompaniesTab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved">("approved");
  const { user } = useAuth();

  const validCount = useMemo(() => rows.filter((r) => r.errors.length === 0).length, [rows]);
  const invalidCount = rows.length - validCount;

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast.error("CSV vazio ou sem cabeçalho.");
      setRows([]);
      return;
    }
    const headers = mapHeaders(parsed[0]);
    if (!headers.includes("name")) {
      toast.error("O CSV precisa de uma coluna 'nome'.");
      setRows([]);
      return;
    }
    const dataRows: ParsedRow[] = parsed.slice(1).map((r, i) => {
      const data: Partial<Record<CsvHeader, string>> = {};
      headers.forEach((h, idx) => {
        if (!h) return;
        const v = (r[idx] ?? "").trim();
        if (v) data[h] = v;
      });
      const errors: string[] = [];
      if (!data.name || data.name.length < 2) errors.push("Nome ausente/curto");
      if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
        errors.push("Email inválido");
      return { index: i + 2, data, errors };
    });
    setRows(dataRows);
    toast.success(`Arquivo lido: ${dataRows.length} linha(s)`);
  }

  async function runImport() {
    if (validCount === 0 || importing) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;

    // Preload category slug → id map
    const { data: cats } = await supabase.from("categories").select("id, slug, name");
    const bySlug = new Map<string, string>();
    (cats ?? []).forEach((c) => {
      bySlug.set(c.slug.toLowerCase(), c.id);
      bySlug.set(
        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        c.id,
      );
    });

    // Preload city slug → id map
    const { data: cities } = await supabase.from("cities").select("id, slug, name");
    const cityBySlug = new Map<string, string>();
    (cities ?? []).forEach((c) => {
      cityBySlug.set(c.slug.toLowerCase(), c.id);
      cityBySlug.set(
        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        c.id,
      );
    });

    function slugifyLocal(input: string) {
      return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    for (const r of rows) {
      if (r.errors.length > 0) continue;
      const d = r.data;
      const catKey = (d.category ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const category_id = catKey ? bySlug.get(catKey) ?? null : null;
      const cityKey = (d.city ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const city_id = cityKey ? cityBySlug.get(cityKey) ?? null : null;
      if (!city_id) {
        fail += 1;
        continue;
      }
      // Resolve/create neighborhood
      let neighborhood_id: string | null = null;
      if (d.neighborhood) {
        const nbSlug = slugifyLocal(d.neighborhood);
        const { data: existing } = await supabase
          .from("neighborhoods")
          .select("id")
          .eq("city_id", city_id)
          .eq("slug", nbSlug)
          .maybeSingle();
        if (existing?.id) {
          neighborhood_id = existing.id;
        } else {
          const { data: created } = await supabase
            .from("neighborhoods")
            .insert({ city_id, name: d.neighborhood, slug: nbSlug, is_active: true })
            .select("id")
            .single();
          neighborhood_id = created?.id ?? null;
        }
      }
      try {
        const { error } = await supabase.from("companies").insert({
          name: d.name!,
          description: d.description ?? null,
          category_id,
          city_id,
          neighborhood_id,
          address: d.address ?? null,
          number: d.number ?? null,
          complement: d.complement ?? null,
          cep: d.cep ?? null,
          phone: d.phone ?? null,
          whatsapp: d.whatsapp ?? null,
          email: d.email ?? null,
          website: d.website ?? null,
          instagram_url: d.instagram_url ?? null,
          facebook_url: d.facebook_url ?? null,
          status,
        });
        if (error) throw error;
        ok += 1;
      } catch (e) {
        console.error("import row failed", r.index, e);
        fail += 1;
      }
    }

    if (user) {
      await logAdminAction(user.id, "company.import.csv", "company", null, {
        file: fileName,
        ok,
        fail,
        default_status: status,
      });
    }
    setImporting(false);
    if (ok > 0) toast.success(`${ok} empresa(s) importada(s)${fail ? `, ${fail} falha(s)` : ""}`);
    else toastError(new Error("Nenhuma empresa importada"), "Falha na importação");
    if (fail === 0) setRows([]);
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <h3 className="font-display text-base font-semibold">Importar empresas via CSV</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Colunas aceitas (qualquer ordem, cabeçalho obrigatório): <code>nome</code>*, <code>descricao</code>,
          {" "}<code>categoria</code> (slug), <code>cidade</code>, <code>bairro</code>, <code>endereco</code>,
          {" "}<code>numero</code>, <code>cep</code>, <code>telefone</code>, <code>whatsapp</code>,
          {" "}<code>email</code>, <code>site</code>, <code>instagram</code>, <code>facebook</code>.
          Separador: vírgula ou ponto-e-vírgula. Campos entre aspas suportados.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> Selecionar CSV
          </Button>
          <Button size="sm" variant="outline" onClick={downloadTemplate}>
            <Download className="mr-1 h-3 w-3" /> Baixar modelo
          </Button>
          <label className="ml-2 flex items-center gap-2 text-xs">
            Status inicial:
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value as "pending" | "approved")}
            >
              <option value="approved">Aprovadas (publicadas)</option>
              <option value="pending">Pendentes (revisão manual)</option>
            </select>
          </label>
        </div>
        {fileName && (
          <p className="mt-2 text-xs text-muted-foreground">
            Arquivo: <strong>{fileName}</strong> · {rows.length} linha(s) · {validCount} válida(s)
            {invalidCount > 0 && <> · {invalidCount} com erro</>}
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty>Nenhum arquivo carregado ainda.</Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2">Linha</th>
                  <th scope="col" className="px-3 py-2">Nome</th>
                  <th scope="col" className="px-3 py-2">Categoria</th>
                  <th scope="col" className="px-3 py-2">Cidade / Bairro</th>
                  <th scope="col" className="px-3 py-2">Contato</th>
                  <th scope="col" className="px-3 py-2">Validação</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r) => (
                  <tr key={r.index} className="border-t border-border align-top">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{r.index}</td>
                    <td className="px-3 py-2 font-medium">{r.data.name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.data.category ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {[r.data.city, r.data.neighborhood].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.data.phone || r.data.whatsapp || r.data.email || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.errors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3 w-3" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          <FileWarning className="h-3 w-3" /> {r.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <p className="border-t border-border p-2 text-center text-xs text-muted-foreground">
                Exibindo 100 de {rows.length} linhas (todas serão importadas).
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={runImport} disabled={importing || validCount === 0}>
              {importing ? "Importando…" : `Importar ${validCount} empresa(s)`}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
