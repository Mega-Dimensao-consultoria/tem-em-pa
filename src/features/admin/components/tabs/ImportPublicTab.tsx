import { useState, useRef } from "react";
import Papa from "papaparse";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Upload, StopCircle } from "lucide-react";
import {
  importPublicBatch,
  IMPORT_BATCH_SIZE,
  type RowInput,
} from "@/features/admin/functions/importPublic.functions";
import { toastError } from "@/lib/safe";

type Source = "inep_escolas" | "cnes_saude";

type Preset = {
  label: string;
  hint: string;
  detect: (headers: string[]) => boolean;
  map: (row: Record<string, string>) => RowInput | null;
};

/**
 * Mapeamento de colunas por fonte. Aceita variações comuns dos arquivos
 * oficiais (INEP Censo Escolar, CNES Estabelecimentos).
 */
const PRESETS: Record<Source, Preset> = {
  inep_escolas: {
    label: "INEP — Escolas públicas",
    hint: "Aceita o CSV do Censo Escolar (arquivo ESCOLAS). Filtra automaticamente apenas escolas públicas (federal/estadual/municipal).",
    detect: (h) => h.some((x) => /CO_ENTIDADE/i.test(x)) && h.some((x) => /NO_ENTIDADE/i.test(x)),
    map: (r) => {
      const dep = String(r.TP_DEPENDENCIA ?? r.tp_dependencia ?? "").trim();
      // 1=Federal, 2=Estadual, 3=Municipal, 4=Privada
      if (dep === "4") return null;
      const code = String(r.CO_ENTIDADE ?? r.co_entidade ?? "").trim();
      const name = String(r.NO_ENTIDADE ?? r.no_entidade ?? "").trim();
      const city = String(r.NO_MUNICIPIO ?? r.no_municipio ?? "").trim();
      const uf = String(r.SG_UF ?? r.sg_uf ?? "").trim().toUpperCase();
      if (!code || !name || !city || uf.length !== 2) return null;
      const address = [
        r.DS_ENDERECO ?? r.ds_endereco,
        r.NU_ENDERECO ?? r.nu_endereco,
        r.NO_BAIRRO ?? r.no_bairro,
      ]
        .filter(Boolean)
        .join(", ")
        .trim() || null;
      const ddd = String(r.NU_DDD ?? r.nu_ddd ?? "").trim();
      const tel = String(r.NU_TELEFONE ?? r.nu_telefone ?? "").trim();
      const phone = ddd && tel ? `(${ddd}) ${tel}` : null;
      const depLabel =
        dep === "1" ? "Escola federal" :
        dep === "2" ? "Escola estadual" :
        dep === "3" ? "Escola municipal" : "Escola pública";
      return {
        external_id: code,
        name,
        city_name: city,
        state: uf,
        address,
        phone,
        description: `${depLabel} cadastrada no Censo Escolar (INEP ${code}).`,
      };
    },
  },
  cnes_saude: {
    label: "CNES — Estabelecimentos de saúde",
    hint: "Aceita o CSV do CNES (tb_estabelecimento). Inclui hospitais, UBS, prontos-socorros e demais unidades cadastradas.",
    detect: (h) =>
      (h.some((x) => /^CO_UNIDADE$|^CNES$/i.test(x))) &&
      h.some((x) => /NO_FANTASIA|NM_FANTASIA/i.test(x)),
    map: (r) => {
      const code = String(r.CO_UNIDADE ?? r.CNES ?? r.co_unidade ?? r.cnes ?? "").trim();
      const name = String(
        r.NO_FANTASIA ?? r.NM_FANTASIA ?? r.no_fantasia ?? r.nm_fantasia ?? "",
      ).trim();
      const city = String(r.NO_MUNICIPIO ?? r.NM_MUNICIPIO ?? r.no_municipio ?? r.nm_municipio ?? "").trim();
      const uf = String(r.SG_UF ?? r.CO_ESTADO_GESTOR ?? r.sg_uf ?? "").trim().toUpperCase();
      if (!code || !name || !city || uf.length !== 2) return null;
      const address = [
        r.NO_LOGRADOURO ?? r.no_logradouro ?? r.DS_ENDERECO ?? r.ds_endereco,
        r.NU_ENDERECO ?? r.nu_endereco,
        r.NO_BAIRRO ?? r.no_bairro,
      ]
        .filter(Boolean)
        .join(", ")
        .trim() || null;
      const phone = String(r.NU_TELEFONE ?? r.nu_telefone ?? "").trim() || null;
      return {
        external_id: code,
        name,
        city_name: city,
        state: uf,
        address,
        phone,
        description: `Estabelecimento de saúde cadastrado no CNES (${code}).`,
      };
    },
  },
};

type Stats = {
  totalRows: number;
  processed: number;
  inserted: number;
  duplicates: number;
  noCity: number;
  errors: number;
  invalid: number;
};

const EMPTY_STATS: Stats = {
  totalRows: 0,
  processed: 0,
  inserted: 0,
  duplicates: 0,
  noCity: 0,
  errors: 0,
  invalid: 0,
};

export function ImportPublicTab() {
  const [source, setSource] = useState<Source>("inep_escolas");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const qc = useQueryClient();

  const importFn = useServerFn(importPublicBatch);

  const handlePickFile = (f: File | null) => {
    setFile(f);
    setStats(EMPTY_STATS);
  };

  const runImport = async () => {
    if (!file) return;
    setRunning(true);
    cancelRef.current = false;
    setStats(EMPTY_STATS);

    const preset = PRESETS[source];
    const rows: RowInput[] = [];
    let invalid = 0;

    // 1) Parse completo (streaming p/ arquivos grandes)
    await new Promise<void>((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: "", // autodetect (INEP usa ;, CNES às vezes ,)
        transformHeader: (h) => h.trim(),
        step: (result) => {
          const mapped = preset.map(result.data);
          if (mapped) rows.push(mapped);
          else invalid++;
        },
        complete: () => resolve(),
        error: (err) => reject(err),
      });
    });

    setStats((s) => ({ ...s, totalRows: rows.length, invalid }));

    if (rows.length === 0) {
      toast.error("Nenhuma linha válida encontrada no arquivo. Verifique o formato/preset.");
      setRunning(false);
      return;
    }

    // 2) Envia em lotes sequenciais
    for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
      if (cancelRef.current) break;
      const batch = rows.slice(i, i + IMPORT_BATCH_SIZE);
      try {
        const res = await importFn({ data: { source, rows: batch } });
        setStats((s) => ({
          ...s,
          processed: s.processed + batch.length,
          inserted: s.inserted + res.inserted,
          duplicates: s.duplicates + res.skipped_duplicate,
          noCity: s.noCity + res.skipped_no_city,
          errors: s.errors + res.errors,
        }));
      } catch (e) {
        setStats((s) => ({ ...s, processed: s.processed + batch.length, errors: s.errors + batch.length }));
        toastError(e, "Falha ao processar lote");
      }
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Importação concluída");
  };

  const progress = stats.totalRows > 0 ? (stats.processed / stats.totalRows) * 100 : 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex gap-3 rounded-md border border-border bg-muted/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">Importação de dados públicos</p>
          <p className="mt-1 text-muted-foreground">
            Faça upload de um CSV oficial (INEP ou CNES) para popular a categoria
            <strong> Utilidade Pública</strong>. O processamento acontece em lotes
            de {IMPORT_BATCH_SIZE} linhas. Registros com o mesmo código INEP/CNES
            já importado são ignorados automaticamente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fonte dos dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as Source[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSource(key)}
                disabled={running}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  source === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{PRESETS[source].hint}</p>

          <div>
            <Label htmlFor="csv-file" className="mb-1 block text-sm">Arquivo CSV</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              disabled={running}
              onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
            />
            {file && (
              <p className="mt-1 text-xs text-muted-foreground">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={runImport} disabled={!file || running}>
              <Upload className="mr-2 h-4 w-4" />
              {running ? "Importando…" : "Iniciar importação"}
            </Button>
            {running && (
              <Button
                variant="outline"
                onClick={() => {
                  cancelRef.current = true;
                }}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Interromper
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(running || stats.totalRows > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  {stats.processed.toLocaleString("pt-BR")} de{" "}
                  {stats.totalRows.toLocaleString("pt-BR")} linhas
                </span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
              <Stat label="Cadastradas" value={stats.inserted} tone="ok" />
              <Stat label="Duplicadas" value={stats.duplicates} />
              <Stat label="Sem cidade no banco" value={stats.noCity} />
              <Stat label="Linhas inválidas" value={stats.invalid} />
              <Stat label="Erros" value={stats.errors} tone={stats.errors > 0 ? "err" : undefined} />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "err" }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 font-display text-lg font-semibold ${
          tone === "ok" ? "text-emerald-600" : tone === "err" ? "text-rose-600" : "text-foreground"
        }`}
      >
        {value.toLocaleString("pt-BR")}
      </dd>
    </div>
  );
}
