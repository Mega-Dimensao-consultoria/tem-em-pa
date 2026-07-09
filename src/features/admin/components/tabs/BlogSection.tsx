import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogPostsTab } from "./BlogPostsTab";
import { BlogCategoriesTab } from "./BlogCategoriesTab";

/** Agrupa as sub-abas Posts e Categorias do blog dentro do painel admin. */
export function BlogSection() {
  return (
    <div className="mt-4">
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <BlogPostsTab />
        </TabsContent>
        <TabsContent value="categorias">
          <BlogCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
