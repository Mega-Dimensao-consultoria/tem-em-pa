import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty } from "../admin-ui";
import { SeoOverrideDialog } from "@/features/seo/components/SeoOverrideDialog";
import { AdminPagination, usePagination } from "../AdminPagination";

type CityRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
};

const KEY = ["admin", "cities-seo"] as const;

export function CitiesSeoTab() {
  const [seoForId, setSeoForId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select(
          "id, name, slug, state, is_active, seo_title, seo_description, og_image_url, canonical_url, noindex",
        )
        .order("name");
      if (error) throw error;
      return data as CityRow[];
    },
  });

  const filtered = data.filter(
    (c) =>
      !filter ||
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.state.toLowerCase() === filter.toLowerCase(),
  );
  const seoCity = seoForId ? data.find((c) => c.id === seoForId) ?? null : null;
  const pg = usePagination(filtered);


  return (
    <section className="mt-4 space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">SEO por cidade</h2>
          <p className="text-sm text-muted-foreground">
            Sobrescreva título, descrição e imagem social por cidade. Deixe vazio
            para usar o template.
          </p>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar cidade ou UF"
          className="max-w-xs"
        />
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <Empty>Nenhuma cidade encontrada.</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Cidade</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">SEO customizado</th>
                <th className="px-4 py-2 font-medium">Indexar</th>
                <th className="px-4 py-2 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pg.paged.map((c) => {
                const hasCustom = !!(c.seo_title || c.seo_description || c.og_image_url);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-medium">
                      {c.name} / {c.state}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">/{c.slug}</td>
                    <td className="px-4 py-2 text-xs">
                      {hasCustom ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                          Sim
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Usa template</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {c.noindex ? (
                        <span className="rounded bg-destructive/10 px-2 py-0.5 text-destructive">
                          noindex
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sim</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSeoForId(c.id)}
                      >
                        <Search className="mr-1 h-4 w-4" /> Editar SEO
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > 0 ? (
        <AdminPagination
          page={pg.page}
          totalPages={pg.totalPages}
          total={pg.total}
          pageSize={pg.pageSize}
          firstItem={pg.firstItem}
          lastItem={pg.lastItem}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          label="cidades"
        />
      ) : null}


      {seoCity ? (
        <SeoOverrideDialog
          table="cities"
          id={seoCity.id}
          open={!!seoForId}
          onOpenChange={(v) => (v ? null : setSeoForId(null))}
          title={`${seoCity.name}/${seoCity.state}`}
          previewUrl={`https://www.temnaminhacidade.com.br/${seoCity.slug}`}
          initial={{
            seo_title: seoCity.seo_title,
            seo_description: seoCity.seo_description,
            og_image_url: seoCity.og_image_url,
            canonical_url: seoCity.canonical_url,
            noindex: seoCity.noindex,
          }}
          invalidateKeys={[KEY, ["city"]]}
        />
      ) : null}
    </section>
  );
}
