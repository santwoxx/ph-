# 🍇 Cardápio Digital — Açaiteria

Cardápio digital completo, com carrinho de compras, checkout, contas de cliente,
painel administrativo (produtos, pedidos e finanças) e autenticação via Firebase.
Feito com **Next.js 14 + TypeScript + Tailwind CSS + Firebase**, pronto para deploy
na **Vercel**.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — visual moderno, responsivo, com foco em telas grandes/4K
- **Firebase Auth** — login de clientes e administradores (mesmo sistema de auth)
- **Firestore** — produtos, pedidos, despesas, configurações da loja
- **Firebase Storage** — fotos dos produtos, logo e banner
- **Zustand** — carrinho de compras persistido no navegador
- **Recharts** — gráficos do painel financeiro

## Como funciona o controle de administrador (IMPORTANTE)

Todo mundo usa o **mesmo login** (e-mail/senha do Firebase Auth). O que diferencia
um cliente de um administrador é a existência de um documento na coleção
`admins/{email-em-minúsculo}` do Firestore.

- As **regras do Firestore** (`firestore.rules`) só liberam escrita em `products`,
  `orders` (mudar status), `expenses` e `settings` para quem tem
  `admins/{seu-email}` cadastrado. Isso é validado **no servidor**, então não dá
  pra burlar pelo app.
- O painel (`/admin/*`) também verifica isso no cliente para redirecionar quem
  não é admin — mas quem garante a segurança de verdade são as regras.
- Ninguém consegue se autopromover a admin: só um admin existente pode cadastrar
  outro (pela tela **Configurações → Administradores**). O **primeiro** admin
  precisa ser criado manualmente com o script `scripts/set-admin.mjs` (explicado
  abaixo), pois ainda não existe nenhum admin no sistema para fazer isso pela UI.
- Clientes fazem login normalmente em `/login`, mas nunca conseguem acessar nada
  em `/admin` — nem lendo/escrevendo direto no Firestore, porque as regras
  bloqueiam.

## 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) e
   crie um novo projeto.
2. **Authentication** → aba *Sign-in method* → ative o provedor **E-mail/senha**.
3. **Firestore Database** → *Criar banco de dados* → modo produção (as regras
   deste projeto já cobrem a segurança) → escolha a região mais próxima dos
   seus clientes.
4. **Storage** → *Vamos começar* → ative com as regras padrão (vamos substituir
   pelas do projeto no passo 3 abaixo).
5. Em **Configurações do projeto → Geral → Seus apps**, clique no ícone `</>`
   para criar um app **Web**, dê um nome e copie os dados do `firebaseConfig`.

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com os dados do passo
anterior:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Essas variáveis são públicas por natureza (fazem parte do SDK do Firebase que
roda no navegador) — quem protege seus dados são as **regras do Firestore/Storage**,
não o segredo dessas chaves.

## 3. Publicar as regras de segurança

Instale o Firebase CLI (uma vez só, globalmente):

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # escolha o projeto que você criou
```

Depois publique as regras deste repositório:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

> Alternativa sem CLI: copie o conteúdo de `firestore.rules` e cole em
> **Firestore Database → Regras** no console, e o conteúdo de `storage.rules`
> em **Storage → Regras**. Publique manualmente pelos dois lugares.

## 4. Criar o primeiro administrador

1. No console: **Configurações do projeto → Contas de serviço → Gerar nova
   chave privada**. Isso baixa um arquivo `.json`.
2. Renomeie/mova esse arquivo para a raiz do projeto com o nome
   `serviceAccountKey.json` (ele já está no `.gitignore`, nunca vai pro git
   nem pra Vercel).
3. Rode:

```bash
node scripts/set-admin.mjs add seuemail@gmail.com
```

Pronto — esse e-mail já pode entrar em `/admin/login` (usando a senha que ele
tiver, ou pode ser necessário criar essa conta antes em `/login` com esse mesmo
e-mail, já que o login usa Firebase Auth). Depois disso, **todo o resto de
administradores pode ser adicionado direto pela tela** Configurações →
Administradores dentro do painel — não precisa mexer em script de novo.

Outros comandos úteis do script:

```bash
node scripts/set-admin.mjs list                    # lista admins atuais
node scripts/set-admin.mjs remove email@dominio.com # remove um admin
```

## 5. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para o cardápio e
`http://localhost:3000/admin/login` para o painel.

## 6. Deploy na Vercel

1. Suba este projeto para um repositório no GitHub/GitLab/Bitbucket.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Environment Variables**, adicione as mesmas 6 variáveis
   `NEXT_PUBLIC_FIREBASE_*` do seu `.env.local` (não suba o `.env.local` nem o
   `serviceAccountKey.json` — ambos já estão no `.gitignore`).
4. Clique em **Deploy**.
5. No **Firebase Console → Authentication → Settings → Authorized domains**,
   adicione o domínio que a Vercel gerou (ex: `seu-projeto.vercel.app`) e o seu
   domínio customizado, se tiver — sem isso o login não funciona em produção.

## Estrutura de dados (Firestore)

| Coleção | Descrição | Quem escreve |
|---|---|---|
| `admins/{email}` | Allowlist de administradores | admins entre si |
| `products/{id}` | Produtos do cardápio (nome, preço, tamanhos, complementos, foto) | admin |
| `orders/{id}` | Pedidos feitos pelos clientes | cliente cria, admin atualiza status |
| `expenses/{id}` | Despesas para o controle financeiro | admin |
| `settings/store` | Dados da loja, taxa de entrega, categorias, chave pix | admin |
| `users/{uid}` | Perfil do cliente (nome, telefone) | o próprio cliente |

Fotos de produtos, logo e banner ficam no **Storage**, em `products/{id}/...`
e `settings/...`.

## Funcionalidades

**Loja (cliente)**
- Cardápio com categorias, busca visual por cartões de produto
- Modal de produto com tamanho, complementos, observações e quantidade
- Carrinho persistente (sobrevive a recarregar a página)
- Checkout com entrega ou retirada, endereço, forma de pagamento (Pix, dinheiro
  com troco, cartão)
- Conta do cliente com histórico de pedidos e status em tempo real

**Painel administrativo** (`/admin`)
- **Visão geral**: faturamento do dia/mês, pedidos em andamento, gráfico dos
  últimos 7 dias, pedidos recentes
- **Produtos**: cadastrar, editar, remover, ativar/desativar, marcar como
  destaque, upload de foto, tamanhos e complementos com preços variáveis
- **Pedidos**: acompanhar em tempo real, avançar status (confirmado → em
  preparo → saiu para entrega → entregue), cancelar
- **Finanças**: receita x despesas dos últimos 6 meses, lançar/remover
  despesas por categoria, lucro do mês calculado automaticamente
- **Configurações**: nome/logo/banner da loja, WhatsApp, Instagram, endereço,
  horário, taxa de entrega, pedido mínimo, categorias do cardápio, chave Pix e
  **gestão dos e-mails administradores**

## Customização visual

As cores (tons de açaí/roxo, berry e dourado) ficam em
[`tailwind.config.ts`](tailwind.config.ts) em `theme.extend.colors`. É só trocar
os valores hex para adaptar à identidade visual da sua marca.

## Próximos passos sugeridos

- Configurar um domínio próprio na Vercel
- Integração com WhatsApp Business API para notificar novos pedidos
- Emissão de nota fiscal / integração com gateway de pagamento real (hoje o
  Pix é apenas informativo — o cliente paga fora do app)
