# 💈 BarberPro — Plataforma de Agendamento para Barbearias

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

> Plataforma **multi-barbearia** com agendamento online público, painel de gestão para barbeiros e admins, e painel superadmin para controle de toda a plataforma.

🌐 **Demo:** [barberpro-mrg9.onrender.com](https://barberpro-mrg9.onrender.com)

---

## 📑 Índice

- [✨ Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura](#️-arquitetura)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🚀 Instalação](#-instalação)
- [⚙️ Configuração](#️-configuração)
- [▶️ Como Executar](#️-como-executar)
- [🗄️ Banco de Dados](#️-banco-de-dados)
- [🔌 Rotas da API](#-rotas-da-api)
- [👥 Níveis de Acesso](#-níveis-de-acesso)
- [📂 Estrutura do Projeto](#-estrutura-do-projeto)
- [🚢 Deploy](#-deploy)
- [🤝 Como Contribuir](#-como-contribuir)

---

## ✨ Funcionalidades

### 📅 Agendamento público
- Lista todas as barbearias ativas da plataforma
- Página de agendamento por barbearia via slug único (ex: `/agenda/minha-barbearia`)
- Seleção de barbeiro, serviço, data e horário disponível
- Verificação de conflitos e bloqueios em tempo real
- Horários fixos: 09h, 10h, 11h, 13h, 14h, 15h, 16h e 17h

### 🧑‍💼 Painel do barbeiro
- Visualização e gerenciamento da própria agenda
- Cadastro de serviços com nome e preço
- Bloqueio de horários individuais ou dia inteiro
- Finalização e exclusão de agendamentos
- Dashboard com faturamento diário, mensal, anual e total

### 🏪 Painel admin da barbearia
- Gestão de todos os barbeiros da barbearia
- Visualização do faturamento consolidado por barbeiro
- Criação, edição e exclusão de usuários (barbeiros e admins)

### 🛡️ Painel superadmin
- Gestão completa de todas as barbearias da plataforma
- Ativação e desativação de barbearias
- Faturamento geral com breakdown por barbearia
- Criação e gerenciamento de qualquer usuário em qualquer barbearia

---

## 🏗️ Arquitetura

```
Cliente (React SPA)
       │
       │ HTTP (axios + sessions)
       ▼
Backend (Express 5 + SQLite)
       │
       ├── /api/agendamentos   → agendamentos, bloqueios, horários, faturamento
       ├── /api/usuarios       → CRUD de usuários
       ├── /api/barbearias     → CRUD de barbearias
       ├── /login              → autenticação via sessão
       └── /* (produção)       → serve o build do React
```

Em **produção**, o backend serve o frontend buildado como arquivos estáticos — um único processo, uma única porta.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- npm v9+

> SQLite é embutido — nenhum banco de dados externo é necessário.

---

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/Leonardo-capy/BarberPro.git
cd BarberPro

# Instale as dependências do backend
cd backend && npm install && cd ..

# Instale as dependências do frontend
cd frontend && npm install && cd ..
```

---

## ⚙️ Configuração

Crie um arquivo `.env` dentro da pasta `backend/`:

```ini
# Segredo da sessão (obrigatório em produção)
SESSION_SECRET=uma_string_longa_e_aleatoria

# Ambiente (development | production)
NODE_ENV=development

# Porta (opcional, padrão: 3000)
PORT=3000
```

> ⚠️ Em produção, o servidor **não inicia** sem `SESSION_SECRET` definido.

### Seed inicial

Na primeira execução, o banco é populado automaticamente com dados de demonstração:

| Campo | Valor |
|---|---|
| Barbearia | BarberPro Demo (Naviraí) |
| Superadmin | `admin` / `123456` |
| Barbeiro demo | `lucas` / `654321` |
| Serviços demo | Corte (R$ 35), Barba (R$ 25), Corte + Barba (R$ 55) |

---

## ▶️ Como Executar

### Desenvolvimento

```bash
# Terminal 1 — Backend (porta 3000)
cd backend
npm start

# Terminal 2 — Frontend (porta 3001, com proxy para :3000)
cd frontend
npm start
```

Acesse: `http://localhost:3001`

### Produção (build único)

```bash
# Gera o build do frontend (a partir da raiz)
npm run build

# Sobe o backend (que também serve o frontend buildado)
npm start
```

No **Windows**, também é possível usar o script PowerShell incluso:

```powershell
.\build.ps1
```

---

## 🗄️ Banco de Dados

O arquivo `database.sqlite` é criado automaticamente na pasta `backend/` na primeira execução.

### Tabelas

| Tabela | Descrição |
|---|---|
| `barbearias` | Barbearias da plataforma (nome, slug único, cidade, status ativo) |
| `usuarios` | Barbeiros e admins vinculados a uma barbearia (role, senha bcrypt) |
| `agendamentos` | Agendamentos com cliente, serviço, preço, data, horário e status finalizado |
| `bloqueios` | Horários ou dias inteiros bloqueados por barbeiro |
| `servicos` | Serviços cadastrados por cada barbeiro com nome e preço |

---

## 🔌 Rotas da API

### 🔓 Públicas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/login` | Autenticação via sessão |
| `POST` | `/logout` | Encerra a sessão |
| `GET` | `/api/barbearias` | Lista barbearias ativas |
| `GET` | `/api/barbearias/:slug` | Busca barbearia por slug |
| `GET` | `/api/barbearias/:slug/barbeiros` | Lista barbeiros ativos da barbearia |
| `GET` | `/api/agendamentos/disponiveis/:data` | Horários disponíveis de um barbeiro em uma data |
| `GET` | `/api/agendamentos/servicos` | Serviços de um barbeiro |
| `POST` | `/api/agendamentos` | Cria novo agendamento |

### 🔐 Autenticadas (barbeiro+)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/me` | Dados do usuário logado |
| `GET` | `/api/agendamentos` | Agenda do barbeiro logado |
| `PUT` | `/api/agendamentos/finalizar/:id` | Finaliza atendimento |
| `DELETE` | `/api/agendamentos/:id` | Cancela agendamento |
| `GET/POST/DELETE` | `/api/servicos` | CRUD de serviços próprios |
| `POST` | `/api/agendamentos/toggle-bloqueio` | Liga/desliga bloqueio de horário específico |
| `POST` | `/api/agendamentos/bloquear-dia` | Bloqueia/desbloqueia dia inteiro |
| `GET` | `/api/agendamentos/faturamento` | Faturamento pessoal (diário/mensal/anual/total) |
| `GET` | `/api/admin/dashboard` | Resumo do dashboard (faturamento + top barbeiro/serviço) |

### 👑 Admin da barbearia

| Método | Rota | Descrição |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/admin/usuarios` | Gerenciar usuários da barbearia |
| `GET` | `/api/admin/faturamento-barbearia` | Faturamento consolidado da barbearia |
| `GET` | `/api/admin/barbeiro/:id/faturamento` | Faturamento de barbeiro específico |

### 🛡️ Superadmin

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/barbearias/admin/todas` | Lista todas as barbearias (inclusive inativas) |
| `POST/PUT/DELETE` | `/api/barbearias` | CRUD completo de barbearias |
| `GET` | `/api/admin/faturamento-geral` | Faturamento de toda a plataforma |

---

## 👥 Níveis de Acesso

| Role | Descrição |
|---|---|
| `barbeiro` | Acessa e gerencia apenas a própria agenda e serviços |
| `admin` | Gerencia todos os barbeiros e o faturamento da barbearia |
| `superadmin` | Controle total da plataforma: barbearias, usuários e faturamento global |

---

## 📂 Estrutura do Projeto

```
barbearia agenda/
├── backend/
│   ├── server.js                  # Servidor Express, sessão, middlewares e inicialização
│   ├── database.js                # Criação das tabelas SQLite e seed inicial
│   ├── database.sqlite            # Banco de dados (gerado automaticamente)
│   ├── middleware/
│   │   ├── auth.js                # Guards: verificarLogin, verificarAdmin, verificarSuperAdmin
│   │   └── validate.js            # Validação de inputs de usuário
│   └── routes/
│       ├── agendamentos.js        # Agendamentos, horários disponíveis, bloqueios e faturamento
│       ├── barbearias.js          # CRUD de barbearias
│       └── usuarios.js            # CRUD de usuários
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Roteamento principal (React Router v6)
│   │   ├── context/
│   │   │   └── AuthContext.js     # Contexto global de autenticação
│   │   ├── components/
│   │   │   ├── NavbarAdmin.js     # Navbar do painel admin
│   │   │   ├── PrivateRoute.js    # Proteção de rotas por role
│   │   │   ├── ModalEditarUsuario.js
│   │   │   └── Toast.js
│   │   ├── pages/
│   │   │   ├── Agenda.js          # Lista pública de barbearias
│   │   │   ├── AgendaBarbearia.js # Agendamento público por barbearia
│   │   │   ├── Login.js
│   │   │   ├── Admin.js           # Painel do barbeiro
│   │   │   ├── AdminBloqueios.js  # Gerenciamento de bloqueios
│   │   │   ├── AdminTotal.js      # Painel admin e superadmin
│   │   │   └── Perfil.js
│   │   └── services/
│   │       └── api.js             # Instância axios com interceptors
│   └── build/                     # Build de produção (gerado por npm run build)
├── build.ps1                      # Script PowerShell de build (Windows)
├── package.json                   # Scripts raiz: build e start
└── README.md
```

---

## 🚢 Deploy

O projeto está configurado para deploy no [Render](https://render.com/).

**Variáveis de ambiente necessárias:**

```ini
NODE_ENV=production
SESSION_SECRET=sua_string_secreta_longa
PORT=3000
```

**Build command:** `npm run build`

**Start command:** `npm start`

> Em produção, o backend serve o frontend buildado na mesma porta — não é necessário configurar dois serviços separados.

---

## 🤝 Como Contribuir

1. Faça um **fork** do repositório
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça commit das alterações:
   ```bash
   git commit -m "feat: descrição da feature"
   ```
4. Envie para o seu fork:
   ```bash
   git push origin feature/minha-feature
   ```
5. Abra um **Pull Request**

---

<div align="center">
  Desenvolvido com ❤️ por <a href="https://github.com/Leonardo-capy">Leonardo-Capy</a>
</div>
