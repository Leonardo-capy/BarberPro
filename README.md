# 💈 BarberPro – Sistema Profissional de Agendamento para Barbearias

Sistema web completo de agendamento online para barbearias, desenvolvido com **React** no frontend e **Node.js/Express** no backend com banco de dados SQLite.

Projeto full stack com autenticação por sessão, múltiplos níveis de usuário (barbeiro e admin total), dashboard administrativo e controle completo de serviços e usuários.

---

## 🚀 Funcionalidades Implementadas

### 🌍 Área Pública (Cliente)
- Calendário interativo com FullCalendar
- Seleção dinâmica de barbeiro
- Exibição automática de horários disponíveis
- Bloqueio automático de domingos
- Desativação de horários passados no dia atual
- Validação de conflitos de agendamento
- Bloqueio de horários indisponíveis
- Cadastro de agendamento vinculado ao barbeiro
- Interface responsiva e moderna

---

### 🔐 Área Administrativa (Barbeiro)
- Login com autenticação via sessão
- Listagem de agendamentos do barbeiro logado
- Contador total de agendamentos
- Contador de agendamentos do dia
- Finalização de agendamentos (marcar como pago)
- Exclusão de agendamentos
- Sistema de bloqueio e desbloqueio de horários
- Visualização de bloqueios por data
- Controle de serviços (CRUD vinculado ao barbeiro)
- Cálculo automático de faturamento

---

### 👑 Área Admin Total
- Gestão completa de usuários
- Criação de novos usuários com roles (admin / barbeiro)
- Edição de usuários (nome, cargo e senha)
- Exclusão de usuários
- Visualização geral do sistema
- Dashboard com estatísticas globais

---

## 📊 Dashboard Administrativo
- Total de agendamentos finalizados
- Faturamento total
- Total de clientes únicos
- Barbeiro com maior faturamento
- Serviço mais realizado

---

## 🧠 Regras de Negócio
- Não permite agendamento em datas passadas
- Não permite agendamento aos domingos
- Não permite dois agendamentos no mesmo horário
- Não permite agendamento em horário bloqueado
- Horários fixos definidos no backend
- Separação total entre dados de cada barbeiro
- Rotas protegidas por middleware de autenticação
- Controle de acesso baseado em role

---

## 🛠 Tecnologias Utilizadas

### Frontend (React)
- React 18
- React Router DOM v6
- Axios
- FullCalendar
- CSS3 com animações
- Context API para gerenciamento de estado

### Backend (Node.js)
- Node.js
- Express
- SQLite
- Express-session
- Bcrypt (hash de senha)
- Middleware de autenticação

---

## 📁 Estrutura do Projeto

```bash
barberpro/
│
├── public/                    # Arquivos públicos
│   ├── index.html             # Template HTML principal
│   └── favicon.ico
│
├── src/                       # Código fonte React
│   ├── components/             # Componentes reutilizáveis
│   │   ├── NavbarAdmin.js
│   │   ├── NavbarCliente.js
│   │   ├── PrivateRoute.js
│   │   ├── ModalEditarUsuario.js
│   │   └── Toast.js
│   │
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Index.js            # Página pública (agendamento)
│   │   ├── Login.js            # Página de login
│   │   ├── Admin.js             # Painel do barbeiro
│   │   ├── AdminBloqueios.js    # Gerenciamento de bloqueios
│   │   ├── AdminTotal.js        # Painel admin total
│   │   └── Perfil.js            # Perfil do usuário
│   │
│   ├── context/                 # Contextos React
│   │   └── AuthContext.js       # Contexto de autenticação
│   │
│   ├── services/                 # Serviços
│   │   └── api.js                # Configuração do Axios
│   │
│   ├── App.js                    # Componente principal
│   ├── App.css                    # Estilos globais
│   └── index.js                    # Ponto de entrada
│
├── routes/                       # Rotas do backend
│   ├── agendamentos.js
│   └── usuarios.js
│
├── middleware/                    # Middlewares
│   └── auth.js
│
├── database.js                    # Configuração do banco
├── server.js                      # Servidor backend
├── database.sqlite                # Banco de dados
├── package.json
└── README.md
```
---

## 🔄 Fluxo do Sistema

### Cliente

1. Acessa a página inicial pública
2. Seleciona o barbeiro
3. Escolhe uma data no calendário
4. Visualiza horários disponíveis
5. Seleciona um serviço
6. Preenche nome e telefone
7. Confirma o agendamento

### Barbeiro

1. Realiza login
2. Visualiza apenas seus agendamentos
3. Pode finalizar ou excluir agendamentos
4. Gerencia seus próprios serviços
5. Acompanha faturamento individual
6. Bloqueia/desbloqueia horários

### Admin Total

1. Realiza login
2. Gerencia todos os usuários
3. Acompanha dados gerais do sistema
4. Controla acesso ao sistema

---

## 🔐 Sistema de Segurança

- Senhas criptografadas com bcrypt
- Sessões via express-session
- Middleware de verificação de login
- Middleware de verificação por role
- Proteção de rotas administrativas
- Rotas públicas e privadas no React
- Respostas HTTP padronizadas

---

## 💻 Como Executar

1. Backend
```bash
# Na raiz do projeto
node server.js
```
O servidor backend rodará em http://localhost:3000

2. Frontend
```bash
# Em outro terminal
nmp start
```
O frontend React rodará em http://localhost:3001

---

## 👤 Usuários Pré-Cadastrados

```bash
| Usuário           | Senha  | Role     | Acesso                |
|-------------------|--------|----------|-----------------------|
| Chefe dos cabelo  | 123456 | admin    | Total                 |
| lucas             | 654321 | barbeiro | Próprios agendamentos |
```

---

## 🎯 Objetivo do Projeto

Projeto desenvolvido para prática real de desenvolvimento full stack, simulando um sistema profissional de agendamento para barbearias com:

- Separação clara entre frontend e backend
- Autenticação completa
- Controle de acesso baseado em roles
- Interface moderna e responsiva
- CRUD completo
- Regras de negócio complexas

---

## 📌 Melhorias Futuras

- [ ] Envio de e-mail de confirmação
- [ ] Recuperação de senha
- [ ] Upload de foto de perfil
- [ ] Relatórios em PDF
- [ ] Notificações em tempo real
- [ ] Modo escuro/claro
- [ ] Versão PWA

---

💈 BarberPro  
Desenvolvido com React, Node.js e muito ☕