import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Users, Store, Headphones } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqQO } from "../functions/faqQuery";
import type { FaqItem } from "../functions/publicFaq.functions";

const GROUPS = [
  {
    key: "moradores" as const,
    title: "Moradores e visitantes",
    icon: Users,
  },
  {
    key: "empresas" as const,
    title: "Empresas e profissionais",
    icon: Store,
  },
];

export function FaqSection() {
  const { data } = useSuspenseQuery(faqQO);
  const items = data as FaqItem[];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-20" aria-labelledby="faq-heading">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Perguntas frequentes
        </span>
        <h2 id="faq-heading" className="mt-4 font-display text-3xl font-bold md:text-4xl">
          Tire suas dúvidas
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
          As perguntas que mais recebemos de quem busca e de quem anuncia na plataforma.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.category === group.key);
          if (groupItems.length === 0) return null;
          const Icon = group.icon;
          return (
            <div key={group.key}>
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {group.title}
              </h3>
              <Accordion type="single" collapsible className="space-y-3">
                {groupItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <h3 className="font-display text-xl font-bold md:text-2xl">
          Não encontrou o que procurava?
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Nossa equipe responde suas dúvidas por e-mail em pouco tempo.
        </p>
        <Link
          to="/contato"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Headphones className="h-4 w-4" /> Fale com a nossa Central de Atendimento
        </Link>
      </div>
    </section>
  );
}
