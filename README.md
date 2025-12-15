# 📊 Indicadores de Vendas

Uma aplicação web robusta e moderna para análise de indicadores de vendas, ticket médio e performance por loja/vendedor a partir de planilhas Excel.

## 🚀 Funcionalidades

- **Upload de Excel**: Leitura de arquivos `.xlsx` e `.xls` diretamente no navegador.
- **Mapeamento Inteligente**: Associação automática de Gerentes e Cidades baseada em planilha auxiliar.
- **Dashboards Interativos**:
  - Gráficos de barras, linhas e rankings.
  - Análise por Loja, Vendedor, Marca, Produto e Cidade.
  - Ticket Médio por dia da semana e mensal.
- **Filtros Avançados**: Multi-seleção para refinar a análise.
- **Autenticação**: Sistema de Login e Registro integrado com **Supabase**.
- **Design Moderno**: Interface responsiva com suporte a **Modo Escuro (Dark Mode)**.
- **Exportação**: Gera relatórios consolidados em Excel.

## 🛠️ Tecnologias

- **Frontend**: React 19, Tailwind CSS
- **Gráficos**: Recharts
- **Processamento de Dados**: SheetJS (XLSX)
- **Backend/Auth**: Supabase
- **Utils**: Day.js

## 📦 Como rodar

Como este projeto utiliza ES Modules via CDN (`esm.sh`), você pode rodá-lo usando qualquer servidor estático simples.

### Usando Python (se tiver instalado):
```bash
python3 -m http.server
# Acesse http://localhost:8000
```

### Usando Node.js (npx):
```bash
npx serve .
```

## 🔐 Configuração do Supabase

O projeto já possui chaves públicas configuradas para demonstração. Para produção, crie um arquivo `.env` ou configure as variáveis no seu serviço de hospedagem:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
