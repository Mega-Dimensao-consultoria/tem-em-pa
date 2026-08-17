import { MapPin, Users, Star, Store } from "lucide-react";

const PILLARS = [
  {
    icon: MapPin,
    title: "Perto de você",
    text: "Empresas e pequenos negócios, todos organizados por cidade, bairro e categoria, para achar rápido quem atende na sua região. Conectando quem precisa com quem oferece o serviço!",
  },
  {
    icon: Users,
    title: "Gratuito para usar",
    text: "procurar comércios, serviços e eventos é 100% gratuito para moradores e visitantes. Basta selecionara sua cidade, e encontrar aquele profissional que fará o serviço que você precisa.",
  },
  {
    icon: Star,
    title: "Avaliações reais",
    text: "As opiniões dos clientes são reais! Gostou do serviço de alguém que conheceu em nossa plataforma? Então deixe sua avaliação e indique para mais pessoas.",
  },
  {
    icon: Store,
    title: "Feito para o comércio local",
    text: "Cadastre seu pequeno negócio gratuitamente, logo que aprovamos o seu cadastro, você recebe um mini-site para que você possa divulgar seus produtos e serviços e deixar sua marca online.",
  },
];

export function AboutSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16" aria-labelledby="sobre-heading">
      <div className="text-center">
        <h2 id="sobre-heading" className="font-display text-3xl font-bold md:text-4xl">
          O que é o <span className="text-primary">Tem na minha cidade</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
          Somos o catálogo digital multi-cidade que reúne, em um só lugar, os melhores
          comércios, empresas e profissionais liberais da sua região. De um restaurante
          ao eletricista de confiança, você encontra tudo aqui com um clique.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:border-primary/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
