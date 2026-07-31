import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SitePagesTab } from "./SitePagesTab";
import { FaqTab } from "./FaqTab";

/** Groups site page editing and FAQ management under the "Páginas" admin tab. */
export function PagesSection() {
  return (
    <Tabs defaultValue="estaticas" className="mt-2">
      <TabsList>
        <TabsTrigger value="estaticas">Páginas do site</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>
      <TabsContent value="estaticas">
        <SitePagesTab />
      </TabsContent>
      <TabsContent value="faq">
        <FaqTab />
      </TabsContent>
    </Tabs>
  );
}
