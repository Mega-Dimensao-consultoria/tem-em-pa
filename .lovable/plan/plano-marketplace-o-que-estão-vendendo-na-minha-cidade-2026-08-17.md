# Plano: Marketplace "O que estão vendendo na minha cidade?"

Implementação de uma seção de marketplace para produtos, com galeria de até 10 fotos, filtros por cidade e categorias, e sistema de produtos promovidos.

## User Review Required

> [!IMPORTANT]
> - O limite de 10 fotos por produto foi aplicado.
> - O limite de 10 produtos **promovidos** por empresa é garantido por trigger no banco.
> - A categoria do produto será preenchida manualmente pelo dono no momento do cadastro.

- **Dúvida**: Deseja categorias pré-definidas (ex: Eletrônicos, Imóveis, Serviços) ou campo de texto livre?
- **Dúvida**: O botão de "Comprar/Ver mais" deve abrir o WhatsApp da empresa ou um modal com detalhes e todas as fotos antes?

## Proposta Técnica

### 1. Banco de Dados (Supabase)
- [x] Migração executada: colunas `image_url_3-10`, `is_promoted`, `category` adicionadas à tabela `products`.
- [x] Trigger `trg_check_company_promoted_products_limit` criado para impor limite de 10 itens promovidos por empresa.
- [x] RLS atualizado para permitir visualização pública apenas de produtos de empresas aprovadas.

### 2. Gerenciamento (Painel do Dono)
- **`useProducts.ts`**: Atualizar hooks para suportar os novos campos (is_promoted, category, imagens 1-10).
- **`ProductForm.tsx`**: Expandir para permitir upload de 10 fotos (grade) e seleção de categoria/promoção.
- **`ProductList.tsx`**: Adicionar badges de "Promovido" e indicação de múltiplas fotos.

### 3. Marketplace (Frontend Público)
- **Nova Rota `/vendas`**:
  - Grid de produtos com scroll infinito ou paginação.
  - Filtros: Busca por nome, Seleção de Cidade, Filtro por Categoria.
  - Card de Produto: Imagem principal, preço destacado, nome da empresa e cidade.
- **Modal de Detalhes**: Galeria de fotos (slider), descrição completa e botão "Falar com vendedor" (WhatsApp).

### 4. Home
- **Seção "Destaques do Marketplace"**: Carrossel ou grid com 10 itens aleatórios marcados como `is_promoted`.

## Próximos Passos
1. Atualizar hooks de dados.
2. Criar interface de galeria no formulário.
3. Desenvolver a página pública de marketplace.
