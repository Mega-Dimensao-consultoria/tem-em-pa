# Plano de Melhorias no Marketplace

Implementação de categorias fixas, filtros avançados, administração centralizada e otimização de SEO para produtos.

## Mudanças no Banco de Dados

- Criar tabela `product_categories` com RLS e permissões para administradores.
- Adicionar coluna `product_category_id` na tabela `products` para vincular produtos às categorias fixas.
- Inserir categorias iniciais (Eletrônicos, Móveis, Vestuário, etc.).

## Painel Administrativo

- **Nova Aba "Marketplace"**:
  - Tela de administração geral para listar todos os produtos do site.
  - Filtros por empresa, categoria e status.
  - Ação para desativar anúncios de empresas específicas.
  - Edição direta de detalhes do produto pelo administrador.
- **Gerenciamento de Categorias**:
  - CRUD de categorias de produtos dentro da aba de produtos/marketplace.

## Filtros e Busca no Frontend

- **Filtro de Preço**:
  - Implementação de Slider (Range) para intervalo de preços.
  - Inputs de texto (Min/Max) editáveis sincronizados com o slider.
  - Valores pré-definidos para acesso rápido.
- **Categorias**:
  - Substituir o campo de texto livre por um Select carregado do banco de dados.

## SEO e Sitemap

- **Sitemap de Produtos**:
  - Criar `/sitemap-products/$page` seguindo o padrão de 10k URLs por página.
  - Registrar no `/sitemap.xml` (index).
- **JSON-LD Product**:
  - Implementar metadados estruturados `Product` na página de marketplace (modal/detalhes) para indexação rica no Google.

## Detalhes Técnicos

- Utilização de `createServerFn` para ações administrativas de marketplace.
- Componentes Shadcn UI (`Slider`, `Input`, `Dialog`) para a interface de filtros e edição.
- Atualização das rotas de sitemap em `src/routes/sitemap*`.
