# Plano de Implementação: Área "O que estão vendendo na minha cidade?"

Implementação de uma nova seção de marketplace de produtos, permitindo que empresas aprovadas promovam até 10 produtos com galeria de fotos, filtros por cidade e categoria, e contato direto via WhatsApp.

## 1. Banco de Dados e Segurança

### Alterações no Esquema
- **Tabela `products`**:
    - Adicionar `image_url_2` até `image_url_10` (totalizando 10 colunas de imagem).
    - Adicionar `is_promoted` (boolean) para indicar se o produto deve aparecer na vitrine global.
    - Adicionar `is_featured` (boolean) para destaques pagos (roadmap).
    - Adicionar `category` (string/enum) para filtros de tipo de produto.
- **Tabela `companies`**:
    - Garantir que a contagem de produtos promovidos seja validada (máx 10).

### Políticas de Segurança (RLS)
- `SELECT`: Público para produtos de empresas com `status = 'approved'`, `is_active = true` e que possuam ao menos uma imagem (`image_url_1 IS NOT NULL`).
- `INSERT/UPDATE/DELETE`: Apenas o `owner_id` da empresa vinculada ou administradores.

## 2. Interface Administrativa (Painel do Dono)

### Gerenciamento de Produtos
- **Formulário de Produto**:
    - Expandir `ProductForm` para suportar 10 imagens (usando `AttachmentPicker` ou `ImageUpload`).
    - Adicionar campos obrigatórios: Nome, Descrição, Preço, Categoria e ao menos 1 Imagem.
    - Toggle "Promover para a Vitrine Global" (respeitando o limite de 10).
- **Lista de Produtos**:
    - Indicador visual de produtos promovidos.
    - Validação de limite de 10 produtos totais por empresa.

## 3. Novas Rotas e Navegação

### Menu e Roteamento
- Adicionar "O que estão vendendo?" no Menu principal (`Navigation`).
- **Nova Rota**: `/o-que-estao-vendendo` (e opcionalmente `/vendas`).
    - Listagem paginada (30 por página).
    - Filtros: Busca por nome, Seleção de Cidade, Categoria de Produto.

### Componentes de Visualização
- **ProductCard**: Exibição em grid com Foto Destaque, Preço, Nome e Localização (Bairro - Cidade/UF).
- **ProductDetailModal**:
    - Galeria de imagens (slides).
    - Detalhes do produto e da empresa vendedora.
    - Botão "Falar com o Vendedor" (link direto para WhatsApp da empresa).

## 4. Integração na Home
- Nova seção: "Produtos que estão vendendo aqui".
- Carrossel ou Grid com os produtos promovidos mais recentes/aleatórios.

## Detalhes Técnicos

- **Tecnologias**: TanStack Start, Supabase (RLS + Storage), Tailwind CSS, Lucide Icons.
- **Performance**: Uso de `useSuspenseQuery` para carregamento de dados e `createServerFn` para filtros complexos se necessário.
- **Validação**: Triggers no banco de dados para garantir que apenas empresas aprovadas promovam produtos e para impor o limite de 10 itens.

---

### Questões para Discussão
1. As categorias de produtos devem ser fixas (enum) ou dinâmicas (tabela separada)?
2. O botão "Falar com o vendedor" deve abrir o WhatsApp diretamente ou exibir também o e-mail/telefone fixo?
3. O limite de 10 produtos é por empresa no total ou apenas 10 produtos *promovidos* na vitrine global?
