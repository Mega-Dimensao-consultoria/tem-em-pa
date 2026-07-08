import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllCompaniesTab } from "./AllCompaniesTab";
import { PendingCompaniesTab } from "./PendingCompaniesTab";
import { FlaggedCompaniesTab } from "./FlaggedCompaniesTab";
import { DuplicatesTab } from "./DuplicatesTab";

export function CompaniesAdminSection() {
  return (
    <Tabs defaultValue="todas" className="mt-2">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="todas">Todas as empresas</TabsTrigger>
        <TabsTrigger value="pendentes">Pendentes de aprovação</TabsTrigger>
        <TabsTrigger value="sinalizadas">Reivindicações & denúncias</TabsTrigger>
        <TabsTrigger value="duplicadas">Duplicadas</TabsTrigger>
      </TabsList>
      <TabsContent value="todas"><AllCompaniesTab /></TabsContent>
      <TabsContent value="pendentes"><PendingCompaniesTab /></TabsContent>
      <TabsContent value="sinalizadas"><FlaggedCompaniesTab /></TabsContent>
      <TabsContent value="duplicadas"><DuplicatesTab /></TabsContent>
    </Tabs>
  );
}
