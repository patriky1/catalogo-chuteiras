# Catálogo de Chuteiras — versão Netlify

Site de catálogo de chuteiras com painel administrativo, **tudo em um único projeto hospedado no Netlify**.
Não precisa de Turso, Render, Cloudinary nem de qualquer outro serviço.

| Parte | Onde roda |
|---|---|
| Site (React + Vite) | Netlify (arquivos estáticos) |
| API (`/api/*`) | **Netlify Functions** — pasta `netlify/functions` |
| Produtos e fotos | **Netlify Blobs** — armazenamento embutido do Netlify |
| Login do admin | Variáveis de ambiente do Netlify (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) |

> **Por que existe uma "function"?** Um site 100% estático não consegue guardar o que o admin
> cadastra para outros visitantes verem. A function é um arquivo dentro deste mesmo projeto,
> que o Netlify executa automaticamente. Você não instala nem configura servidor nenhum.

---

## Colocar no ar (passo a passo)

Tempo: ~15 minutos. Você precisa de uma conta no **GitHub** e uma no **Netlify** (ambas grátis).

### 1. Enviar o código para o GitHub

1. Entre em https://github.com → **New repository** → nome `catalogo-chuteiras` → **Private** → **Create repository**.
2. Na página do repositório, clique em **uploading an existing file**.
3. Descompacte o zip, abra a pasta `catalogo-chuteiras` e **arraste todo o conteúdo dela** para a página
   (use Chrome ou Edge para que as pastas sejam enviadas). Envie também os arquivos que começam com ponto
   (`.gitignore`, `.env.example`). **Não envie** um arquivo `.env` se você tiver criado um.
4. Clique em **Commit changes**. Na raiz do repositório devem aparecer: `netlify/`, `public/`, `src/`,
   `netlify.toml`, `package.json`, `index.html`.

> Se você já tem o repositório da versão anterior, apague os arquivos antigos (pastas `backend/`,
> `frontend/`, `render.yaml`) ou crie um repositório novo.

### 2. Criar o site no Netlify

1. Entre em https://app.netlify.com (pode usar a conta do GitHub).
2. **Add new project → Import an existing project → GitHub** → autorize e escolha `catalogo-chuteiras`.
3. As configurações de build já vêm do `netlify.toml` — **não altere nada** (Build command
   `npm run build`, Publish directory `dist`, Functions directory `netlify/functions`).
4. Antes de publicar, clique em **Add environment variables** (ou faça no passo 3 abaixo) e cadastre:

   | Variável | Exemplo | Para quê |
   |---|---|---|
   | `ADMIN_EMAIL` | `voce@gmail.com` | Login do painel |
   | `ADMIN_PASSWORD` | uma senha forte | Senha do painel |
   | `VITE_STORE_NAME` | `Chuteira Pro` | Nome da loja |
   | `VITE_STORE_SLOGAN` | `Chuteiras novas e seminovas` | Frase do topo |
   | `VITE_STORE_WHATSAPP` | `5511987654321` | WhatsApp da loja (só números, com 55 + DDD) |

5. Clique em **Deploy**. Em 1–2 minutos o site fica no ar num endereço como
   `https://nome-aleatorio.netlify.app`.

### 3. (Se pulou) cadastrar as variáveis depois

**Project configuration → Environment variables → Add a variable**. Depois de adicionar ou
mudar variáveis, vá em **Deploys → Trigger deploy → Deploy project** para aplicar
(as `VITE_*` entram no site na hora do build).

### 4. Usar o painel

1. Abra `https://SEU-SITE.netlify.app/admin` e entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
2. Com o catálogo vazio, você pode clicar em **Adicionar 8 exemplos** para ver o site preenchido,
   ou em **Nova chuteira** para cadastrar as suas.
3. Ao escolher a foto (pode ser direto da câmera do celular), ela é **reduzida e otimizada no próprio
   navegador** antes do envio — fica leve e rápida para os visitantes.

Pronto. Cada alteração no painel aparece no site na hora.

### Extras

- **Mudar o endereço:** Netlify → **Domain management** → *Options → Edit project name* (ex.: `chuteirapro.netlify.app`),
  ou adicione um domínio próprio em **Add a domain**.
- **Trocar a senha do admin:** altere `ADMIN_PASSWORD` nas variáveis e faça um novo deploy.
  As sessões abertas são encerradas automaticamente.
- **Atualizar o código:** qualquer arquivo novo enviado ao GitHub publica o site sozinho.
- **Ver os dados salvos:** Netlify → seu projeto → **Blobs** (stores `catalogo` e `imagens`).

> ⚠️ **Não use o "arrastar a pasta" (Netlify Drop / deploy manual da pasta `dist`)**: esse modo
> publica só o visual, sem a API, e o painel não funciona. Use o GitHub (acima) ou a CLI (abaixo).

### Alternativa: publicar pela linha de comando (sem GitHub)

```bash
npm install
npx netlify-cli login
npx netlify-cli init              # cria o site e vincula a pasta
npx netlify-cli env:set ADMIN_EMAIL voce@gmail.com
npx netlify-cli env:set ADMIN_PASSWORD "SuaSenhaForte"
npx netlify-cli env:set VITE_STORE_WHATSAPP 5511987654321
npx netlify-cli deploy --build --prod
```

---

## Rodar no seu computador (opcional)

Requer Node.js 20+.

```bash
npm install
cp .env.example .env      # ajuste e-mail/senha do admin
npx netlify-cli dev       # site + API em http://localhost:8888
```

Localmente o Netlify usa um armazenamento de teste próprio (pasta `.netlify/`), separado dos dados
do site publicado. Se só quiser mexer no visual sem API: `npm run dev:front`.

---

## Estrutura

```
netlify.toml                 # build, functions, redirecionamento SPA e cabeçalhos
netlify/
  functions/api.mjs          # API: todas as rotas /api/*
  lib/
    auth.mjs                 # login do admin (token assinado + limite de tentativas)
    products.mjs             # regras do catálogo (listar, filtrar, criar, editar, excluir)
    storage.mjs              # Netlify Blobs: produtos, fotos, segurança
    validators.mjs           # validação dos dados enviados pelo admin
    exemplos.mjs             # 8 produtos de exemplo
public/exemplos/             # imagens dos exemplos
src/
  pages/                     # Home, Detalhes, NotFound, admin/*
  components/                # Header, cards, filtros, formulário...
  services/                  # chamadas à API
  context/AuthContext.jsx    # sessão do admin
  utils/image.js             # compressão de fotos no navegador
```

## API

Respostas de sucesso: `{ "data": ... }` · Erros: `{ "error": { "message", "details?" } }`

| Método | Rota | Admin | Descrição |
|---|---|---|---|
| GET | `/api/health` | – | Status |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` (10 tentativas / 15 min por IP) |
| GET | `/api/auth/me` | ✔ | Usuário logado |
| GET | `/api/products` | – | Lista. Filtros: `q`, `brand`, `size`, `minPrice`, `maxPrice`, `status`, `condition`, `sort` (`recent`, `price_asc`, `price_desc`, `name`), `limit` |
| GET | `/api/products/meta` | – | Marcas, tamanhos, totais |
| GET | `/api/products/:id` | – | Detalhes |
| GET | `/api/images/:key` | – | Foto enviada pelo admin |
| POST | `/api/products` | ✔ | Cria (multipart, campo `image` obrigatório) |
| PUT | `/api/products/:id` | ✔ | Edita (multipart, `image` opcional) |
| PATCH | `/api/products/:id/status` | ✔ | `{ status: "disponivel" \| "vendida" }` |
| DELETE | `/api/products/:id` | ✔ | Exclui produto e foto |
| POST | `/api/products/seed` | ✔ | Adiciona os exemplos (catálogo vazio) |

Rotas de admin exigem `Authorization: Bearer <token>`.
