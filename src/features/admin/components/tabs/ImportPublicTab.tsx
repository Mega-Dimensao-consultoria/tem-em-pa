import { useState, useRef } from "react";
import Papa from "papaparse";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Upload, StopCircle, Download } from "lucide-react";
import {
  importPublicBatch,
  IMPORT_BATCH_SIZE,
  type RowInput,
  type ImportRowLog,
} from "@/features/admin/functions/importPublic.functions";

import { downloadCsv, toCsv } from "@/lib/csv";

/** Traduz erros do lote (Zod / servidor) em uma linha legível. */
function describeBatchError(e: unknown, batchStart: number): string {
  const raw = (e as { message?: string } | null)?.message ?? String(e);
  try {
    const issues = JSON.parse(raw) as Array<{
      path?: (string | number)[];
      message?: string;
      maximum?: number;
    }>;
    if (Array.isArray(issues) && issues.length > 0) {
      const first = issues[0];
      const path = first.path ?? [];
      const rowIdx = typeof path[1] === "number" ? path[1] : null;
      const field = path.slice(2).join(".") || "(campo)";
      const line = rowIdx !== null ? batchStart + rowIdx + 2 : null; // +header +1-index
      const where = line ? `linha ~${line}, coluna "${field}"` : `coluna "${field}"`;
      const extra = issues.length > 1 ? ` (+${issues.length - 1} outros)` : "";
      return `${where}: ${first.message ?? "valor inválido"}${extra}`;
    }
  } catch {
    /* não é JSON — usa mensagem crua */
  }
  return raw.slice(0, 300);
}

type Source = "inep_escolas" | "cnes_saude" | "empresas";

type Preset = {
  label: string;
  hint: string;
  detect: (headers: string[]) => boolean;
  map: (row: Record<string, string>) => RowInput | null;
  /** Cabeçalhos do modelo CSV (na ordem em que serão exportados) */
  templateHeaders: string[];
  /** Linhas de exemplo do modelo CSV */
  templateSample: Record<string, string>[];
  /** Descrição legível de cada coluna do modelo */
  templateFields: { name: string; required: boolean; description: string }[];
};

const PRESETS: Record<Source, Preset> = {
  empresas: {
    label: "Empresas (modelo Tem na minha cidade)",
    hint: "Modelo próprio para cadastrar/atualizar empresas em massa. Use quando você tem sua própria planilha (parceiros, associações, listas curadas).",
    detect: (h) => h.includes("external_id") && h.includes("name") && h.includes("city_name"),
    map: (r) => {
      const external_id = String(r.external_id ?? "").trim();
      const name = String(r.name ?? "").trim();
      const city_name = String(r.city_name ?? "").trim();
      const state = String(r.state ?? "").trim().toUpperCase();
      if (!external_id || !name || !city_name || state.length !== 2) return null;
      return {
        external_id,
        name,
        city_name,
        state,
        category_slug: r.category_slug?.trim() || null,
        description: r.description?.trim() || null,
        address: r.address?.trim() || null,
        number: r.number?.trim() || null,
        complement: r.complement?.trim() || null,
        neighborhood: r.neighborhood?.trim() || null,
        cep: r.cep?.trim() || null,
        phone_ddd: r.phone_ddd?.trim() || null,
        phone: r.phone?.trim() || null,
        whatsapp: r.whatsapp?.trim() || null,
        email: r.email?.trim() || null,
        website: r.website?.trim() || null,
        instagram_url: r.instagram_url?.trim() || null,
        facebook_url: r.facebook_url?.trim() || null,
      };
    },
    templateHeaders: [
      "external_id","name","category_slug","city_name","state",
      "description","address","number","complement","neighborhood","cep",
      "phone_ddd","phone","whatsapp","email","website","instagram_url","facebook_url",
    ],
    templateSample: [
      {
        external_id: "PADARIA-001",
        name: "Padaria Central",
        category_slug: "alimentacao",
        city_name: "Curitiba",
        state: "PR",
        description: "Padaria artesanal com café da manhã e almoço executivo.",
        address: "Rua XV de Novembro",
        number: "1234",
        complement: "Loja 2",
        neighborhood: "Centro",
        cep: "80020-310",
        phone_ddd: "41",
        phone: "3222-1234",
        whatsapp: "(41) 99999-1234",
        email: "contato@padariacentral.com.br",
        website: "https://padariacentral.com.br",
        instagram_url: "https://instagram.com/padariacentral",
        facebook_url: "https://facebook.com/padariacentral",
      },
      {
        external_id: "OFICINA-042",
        name: "Auto Mecânica São Jorge",
        category_slug: "servicos",
        city_name: "São Paulo",
        state: "SP",
        description: "Mecânica geral, injeção eletrônica e alinhamento.",
        address: "Av. Paulista",
        number: "900",
        complement: "",
        neighborhood: "Bela Vista",
        cep: "01310-100",
        phone_ddd: "11",
        phone: "3555-0000",
        whatsapp: "(11) 98888-0000",
        email: "",
        website: "",
        instagram_url: "",
        facebook_url: "",
      },
    ],
    templateFields: [
      { name: "external_id", required: true, description: "Código único da empresa na sua planilha (ex.: CNPJ, código interno). É usado para evitar duplicatas em novas importações." },
      { name: "name", required: true, description: "Nome fantasia da empresa." },
      { name: "category_slug", required: false, description: "Slug da categoria (ex.: alimentacao, servicos, utilidade-publica). Se vazio, cai em Utilidade Pública." },
      { name: "city_name", required: true, description: "Nome do município exatamente como cadastrado no Tem na minha cidade (ex.: São Paulo)." },
      { name: "state", required: true, description: "UF com 2 letras (ex.: SP, PR, RJ)." },
      { name: "description", required: false, description: "Descrição curta (até 600 caracteres)." },
      { name: "address", required: false, description: "Logradouro (Rua/Avenida)." },
      { name: "number", required: false, description: "Número do endereço." },
      { name: "complement", required: false, description: "Sala, andar, referência etc." },
      { name: "neighborhood", required: false, description: "Nome do bairro. Se o bairro ainda não existir na cidade, é criado automaticamente." },
      { name: "cep", required: false, description: "CEP no formato 00000-000." },
      { name: "phone_ddd", required: false, description: "Código DDD do telefone (2 dígitos, ex.: 11, 41). Armazenado separado do número." },
      { name: "phone", required: false, description: "Telefone fixo (sem DDD se você informou phone_ddd)." },
      { name: "whatsapp", required: false, description: "Número de WhatsApp." },
      { name: "email", required: false, description: "E-mail de contato." },
      { name: "website", required: false, description: "URL do site oficial (com https://)." },
      { name: "instagram_url", required: false, description: "URL completa do perfil no Instagram." },
      { name: "facebook_url", required: false, description: "URL completa da página no Facebook." },
    ],
  },
  inep_escolas: {
    label: "INEP — Escolas públicas",
    hint: "Aceita o CSV do Censo Escolar (arquivo ESCOLAS). Filtra automaticamente apenas escolas públicas (federal/estadual/municipal).",
    detect: (h) => h.some((x) => /CO_ENTIDADE/i.test(x)) && h.some((x) => /NO_ENTIDADE/i.test(x)),
    map: (r) => {
      const dep = String(r.TP_DEPENDENCIA ?? r.tp_dependencia ?? "").trim();
      if (dep === "4") return null;
      const code = String(r.CO_ENTIDADE ?? r.co_entidade ?? "").trim();
      const name = String(r.NO_ENTIDADE ?? r.no_entidade ?? "").trim();
      const city = String(r.NO_MUNICIPIO ?? r.no_municipio ?? "").trim();
      const uf = String(r.SG_UF ?? r.sg_uf ?? "").trim().toUpperCase();
      if (!code || !name || !city || uf.length !== 2) return null;
      const address = [
        r.DS_ENDERECO ?? r.ds_endereco,
        r.NU_ENDERECO ?? r.nu_endereco,
      ].filter(Boolean).join(", ").trim() || null;
      const neighborhood = (r.NO_BAIRRO ?? r.no_bairro ?? "").toString().trim() || null;
      const ddd = String(r.NU_DDD ?? r.nu_ddd ?? "").trim() || null;
      const tel = String(r.NU_TELEFONE ?? r.nu_telefone ?? "").trim() || null;
      const depLabel =
        dep === "1" ? "Escola federal" :
        dep === "2" ? "Escola estadual" :
        dep === "3" ? "Escola municipal" : "Escola pública";
      return {
        external_id: code, name, city_name: city, state: uf,
        address, neighborhood, phone_ddd: ddd, phone: tel,
        description: `${depLabel} cadastrada no Censo Escolar (INEP ${code}).`,
      };
    },
    templateHeaders: [
      "CO_ENTIDADE","NO_ENTIDADE","TP_DEPENDENCIA","NO_MUNICIPIO","SG_UF",
      "DS_ENDERECO","NU_ENDERECO","NO_BAIRRO","NU_DDD","NU_TELEFONE",
    ],
    templateSample: [
      {
        CO_ENTIDADE: "41000123", NO_ENTIDADE: "EE Exemplo do Centro",
        TP_DEPENDENCIA: "2", NO_MUNICIPIO: "Curitiba", SG_UF: "PR",
        DS_ENDERECO: "Rua Marechal Deodoro", NU_ENDERECO: "500",
        NO_BAIRRO: "Centro", NU_DDD: "41", NU_TELEFONE: "3111-2222",
      },
    ],
    templateFields: [
      { name: "CO_ENTIDADE", required: true, description: "Código INEP da escola (chave única)." },
      { name: "NO_ENTIDADE", required: true, description: "Nome oficial da escola." },
      { name: "TP_DEPENDENCIA", required: true, description: "1=Federal, 2=Estadual, 3=Municipal, 4=Privada (ignorada)." },
      { name: "NO_MUNICIPIO", required: true, description: "Nome do município." },
      { name: "SG_UF", required: true, description: "UF com 2 letras." },
      { name: "DS_ENDERECO", required: false, description: "Logradouro." },
      { name: "NU_ENDERECO", required: false, description: "Número." },
      { name: "NO_BAIRRO", required: false, description: "Bairro." },
      { name: "NU_DDD", required: false, description: "DDD (2 dígitos)." },
      { name: "NU_TELEFONE", required: false, description: "Telefone sem DDD." },
    ],
  },
  cnes_saude: {
    label: "CNES — Estabelecimentos de saúde",
    hint: "Aceita o CSV do CNES (tb_estabelecimento). Inclui hospitais, UBS, prontos-socorros e demais unidades cadastradas.",
    detect: (h) =>
      (h.some((x) => /^CO_UNIDADE$|^CNES$/i.test(x))) &&
      h.some((x) => /NO_FANTASIA|NM_FANTASIA/i.test(x)),
    map: (r) => {
      const code = String(r.CO_UNIDADE ?? r.CNES ?? r.co_unidade ?? r.cnes ?? "").trim();
      const name = String(r.NO_FANTASIA ?? r.NM_FANTASIA ?? r.no_fantasia ?? r.nm_fantasia ?? "").trim();
      const city = String(r.NO_MUNICIPIO ?? r.NM_MUNICIPIO ?? r.no_municipio ?? r.nm_municipio ?? "").trim();
      const uf = String(r.SG_UF ?? r.CO_ESTADO_GESTOR ?? r.sg_uf ?? "").trim().toUpperCase();
      if (!code || !name || !city || uf.length !== 2) return null;
      const address = [
        r.NO_LOGRADOURO ?? r.no_logradouro ?? r.DS_ENDERECO ?? r.ds_endereco,
        r.NU_ENDERECO ?? r.nu_endereco,
      ].filter(Boolean).join(", ").trim() || null;
      const neighborhood = (r.NO_BAIRRO ?? r.no_bairro ?? "").toString().trim() || null;
      const ddd = String(r.NU_DDD ?? r.nu_ddd ?? "").trim() || null;
      const phone = String(r.NU_TELEFONE ?? r.nu_telefone ?? "").trim() || null;
      return {
        external_id: code, name, city_name: city, state: uf,
        address, neighborhood, phone_ddd: ddd, phone,
        description: `Estabelecimento de saúde cadastrado no CNES (${code}).`,
      };
    },
    templateHeaders: [
      "CO_UNIDADE","NO_FANTASIA","NO_MUNICIPIO","SG_UF",
      "NO_LOGRADOURO","NU_ENDERECO","NO_BAIRRO","NU_DDD","NU_TELEFONE",
    ],
    templateSample: [
      {
        CO_UNIDADE: "2270021", NO_FANTASIA: "UBS Vila Exemplo",
        NO_MUNICIPIO: "São Paulo", SG_UF: "SP",
        NO_LOGRADOURO: "Rua das Flores", NU_ENDERECO: "123",
        NO_BAIRRO: "Vila Exemplo", NU_DDD: "11", NU_TELEFONE: "30001000",
      },
    ],
    templateFields: [
      { name: "CO_UNIDADE", required: true, description: "Código CNES do estabelecimento (chave única)." },
      { name: "NO_FANTASIA", required: true, description: "Nome fantasia." },
      { name: "NO_MUNICIPIO", required: true, description: "Nome do município." },
      { name: "SG_UF", required: true, description: "UF com 2 letras." },
      { name: "NO_LOGRADOURO", required: false, description: "Logradouro." },
      { name: "NU_ENDERECO", required: false, description: "Número." },
      { name: "NO_BAIRRO", required: false, description: "Bairro (armazenado em coluna própria — cria o bairro se não existir)." },
      { name: "NU_DDD", required: false, description: "DDD do telefone (2 dígitos), armazenado separado." },
      { name: "NU_TELEFONE", required: false, description: "Telefone sem DDD." },
    ],
  },
};

type Stats = {
  totalRows: number; processed: number; inserted: number;
  duplicates: number; noCity: number; errors: number; invalid: number;
};

const EMPTY_STATS: Stats = {
  totalRows: 0, processed: 0, inserted: 0,
  duplicates: 0, noCity: 0, errors: 0, invalid: 0,
};

export function ImportPublicTab() {
  const [source, setSource] = useState<Source>("empresas");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [logs, setLogs] = useState<ImportRowLog[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "error" | "no_city" | "duplicate" | "ok">("error");
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const qc = useQueryClient();

  const importFn = useServerFn(importPublicBatch);
  const preset = PRESETS[source];

  const handlePickFile = (f: File | null) => {
    setFile(f);
    setStats(EMPTY_STATS);
    setLogs([]);
  };

  const downloadTemplate = () => {
    const csv = toCsv(preset.templateSample, preset.templateHeaders);
    downloadCsv(`modelo-${source}.csv`, csv);
  };

  const runImport = async () => {
    if (!file) return;
    setRunning(true);
    cancelRef.current = false;
    setStats(EMPTY_STATS);
    setLogs([]);

    const rows: RowInput[] = [];
    const invalidLogs: ImportRowLog[] = [];
    let rowIndex = 0; // 0-based row index across CSV (excluding header)

    await new Promise<void>((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: "",
        transformHeader: (h) => h.trim(),
        step: (result) => {
          const csvLine = rowIndex + 2; // +header +1-index
          const raw = result.data;
          const mapped = preset.map(raw);
          if (mapped) {
            rows.push(mapped);
          } else {
            invalidLogs.push({
              level: "error",
              external_id: String(raw.external_id ?? raw.CO_ENTIDADE ?? raw.CO_UNIDADE ?? raw.CNES ?? `linha-${csvLine}`),
              name: String(raw.name ?? raw.NO_ENTIDADE ?? raw.NO_FANTASIA ?? raw.NM_FANTASIA ?? "(sem nome)"),
              city_name: String(raw.city_name ?? raw.NO_MUNICIPIO ?? raw.NM_MUNICIPIO ?? ""),
              state: String(raw.state ?? raw.SG_UF ?? ""),
              reason: `Linha ${csvLine}: campos obrigatórios ausentes/ inválidos (nome, cidade, UF ou identificador). Escolas privadas (TP_DEPENDENCIA=4) também são ignoradas.`,
            });
          }
          rowIndex++;
        },
        complete: () => resolve(),
        error: (err) => reject(err),
      });
    });

    setStats((s) => ({ ...s, totalRows: rows.length, invalid: invalidLogs.length }));
    if (invalidLogs.length > 0) setLogs((l) => [...l, ...invalidLogs]);

    if (rows.length === 0) {
      toast.error("Nenhuma linha válida encontrada no arquivo. Verifique o formato/preset.");
      setRunning(false);
      return;
    }

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
        if (res.logs && res.logs.length > 0) {
          setLogs((l) => [...l, ...res.logs]);
        }
      } catch (e) {
        setStats((s) => ({ ...s, processed: s.processed + batch.length, errors: s.errors + batch.length }));
        const msg = describeBatchError(e, i);
        toast.error("Falha ao processar lote", { description: msg });
        // Registra no console cada linha do lote como erro para o admin ver quais falharam
        const batchLogs: ImportRowLog[] = batch.map((r) => ({
          level: "error",
          external_id: r.external_id,
          name: r.name,
          city_name: r.city_name,
          state: r.state,
          reason: msg,
        }));
        setLogs((l) => [...l, ...batchLogs]);
      }
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Importação concluída");
  };

  const downloadLogs = () => {
    const csv = toCsv(
      logs.map((l) => ({
        status: l.level,
        external_id: l.external_id,
        name: l.name,
        city_name: l.city_name,
        state: l.state,
        reason: l.reason ?? "",
      })),
      ["status", "external_id", "name", "city_name", "state", "reason"],
    );
    downloadCsv(`log-importacao-${source}-${Date.now()}.csv`, csv);
  };

  const filteredLogs = logs.filter((l) => (logFilter === "all" ? true : l.level === logFilter));
  const counts = {
    all: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    no_city: logs.filter((l) => l.level === "no_city").length,
    duplicate: logs.filter((l) => l.level === "duplicate").length,
    ok: logs.filter((l) => l.level === "ok").length,
  };



  const progress = stats.totalRows > 0 ? (stats.processed / stats.totalRows) * 100 : 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex gap-3 rounded-md border border-border bg-muted/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm space-y-2">
          <p className="font-semibold">Como funciona a importação em massa</p>
          <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
            <li>Escolha o tipo de fonte abaixo (empresas próprias, INEP ou CNES).</li>
            <li>Clique em <strong>Baixar modelo CSV</strong> para pegar a planilha com os cabeçalhos corretos e exemplos.</li>
            <li>Preencha o modelo (Excel, Google Sheets, LibreOffice) e exporte de volta como <code>.csv</code> (UTF-8).</li>
            <li>Faça o upload aqui. O processamento é em lotes de {IMPORT_BATCH_SIZE} linhas.</li>
          </ol>
          <p className="text-muted-foreground">
            <strong>Adição vs. atualização:</strong> o sistema deduplica pelo par
            <code className="mx-1">source + external_id</code>. Linhas com um
            <code className="mx-1">external_id</code> já importado na mesma fonte
            são <strong>ignoradas</strong> (não sobrescrevem). Para atualizar dados
            existentes hoje, edite a empresa pelo painel; a atualização via CSV
            está prevista, mas ainda não sobrescreve registros.
          </p>
          <p className="text-muted-foreground">
            <strong>Município:</strong> a linha é ligada a uma cidade já cadastrada
            no Tem na minha cidade pelo par <em>nome + UF</em>. Se o município
            não existir na base, a linha é contabilizada em
            <em> "Sem cidade no banco"</em> e ignorada.
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
          <p className="text-xs text-muted-foreground">{preset.hint}</p>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate} type="button">
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo CSV
            </Button>
          </div>

          <div className="rounded-md border border-border bg-background">
            <div className="border-b border-border px-4 py-2 text-sm font-semibold">
              Colunas esperadas
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Coluna</th>
                    <th className="px-4 py-2">Obrigatória</th>
                    <th className="px-4 py-2">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {preset.templateFields.map((f) => (
                    <tr key={f.name} className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">{f.name}</td>
                      <td className="px-4 py-2 text-xs">
                        {f.required ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Sim</span>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                onClick={() => { cancelRef.current = true; }}
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Interromper
              </Button>
            )}
          </div>

          {logs.length > 0 && (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  Console de importação ({logs.length.toLocaleString("pt-BR")} eventos)
                </p>
                <Button variant="outline" size="sm" type="button" onClick={downloadLogs}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar log CSV
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "Todos", counts.all],
                  ["error", "Erros", counts.error],
                  ["no_city", "Sem cidade", counts.no_city],
                  ["duplicate", "Duplicadas", counts.duplicate],
                  ["ok", "Cadastradas", counts.ok],
                ] as const).map(([key, label, n]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLogFilter(key)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      logFilter === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {label} ({n.toLocaleString("pt-BR")})
                  </button>
                ))}
              </div>

              <div className="max-h-96 overflow-auto rounded-md border border-border bg-background font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <p className="p-4 text-muted-foreground">Nenhum evento para este filtro.</p>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-muted/60 text-left uppercase text-[10px] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">external_id</th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Cidade/UF</th>
                        <th className="px-3 py-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.slice(0, 500).map((l, idx) => (
                        <tr key={idx} className="border-t border-border align-top">
                          <td className="px-3 py-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                l.level === "ok"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                  : l.level === "error"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                                  : l.level === "no_city"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                              }`}
                            >
                              {l.level}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">{l.external_id}</td>
                          <td className="px-3 py-1.5">{l.name}</td>
                          <td className="px-3 py-1.5">
                            {l.city_name}
                            {l.state ? `/${l.state}` : ""}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">{l.reason ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {filteredLogs.length > 500 && (
                <p className="text-xs text-muted-foreground">
                  Exibindo os primeiros 500 eventos. Baixe o log CSV para ver todos ({filteredLogs.length.toLocaleString("pt-BR")}).
                </p>
              )}
            </div>
          )}
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

      {logs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Console de importação ({logs.length.toLocaleString("pt-BR")} eventos)</CardTitle>
            <Button variant="outline" size="sm" type="button" onClick={downloadLogs}>
              <Download className="mr-2 h-4 w-4" />
              Baixar log CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Todos", counts.all],
                ["error", "Erros", counts.error],
                ["no_city", "Sem cidade", counts.no_city],
                ["duplicate", "Duplicadas", counts.duplicate],
                ["ok", "Cadastradas", counts.ok],
              ] as const).map(([key, label, n]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLogFilter(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    logFilter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {label} ({n.toLocaleString("pt-BR")})
                </button>
              ))}
            </div>

            <div className="max-h-96 overflow-auto rounded-md border border-border bg-background font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <p className="p-4 text-muted-foreground">Nenhum evento para este filtro.</p>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/60 text-left uppercase text-[10px] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">external_id</th>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Cidade/UF</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.slice(0, 500).map((l, idx) => (
                      <tr key={idx} className="border-t border-border align-top">
                        <td className="px-3 py-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              l.level === "ok"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                : l.level === "error"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                                : l.level === "no_city"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                            }`}
                          >
                            {l.level}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">{l.external_id}</td>
                        <td className="px-3 py-1.5">{l.name}</td>
                        <td className="px-3 py-1.5">
                          {l.city_name}
                          {l.state ? `/${l.state}` : ""}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">{l.reason ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filteredLogs.length > 500 && (
              <p className="text-xs text-muted-foreground">
                Exibindo os primeiros 500 eventos. Baixe o log CSV para ver todos ({filteredLogs.length.toLocaleString("pt-BR")}).
              </p>
            )}
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
