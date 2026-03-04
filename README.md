# 💈 BarberPro (nome sujeito a mudança) – Sistema Profissional de Agendamento para Barbearias  

Sistema web completo de agendamento online para barbearias, desenvolvido com Node.js, Express e SQLite no backend e HTML, CSS e JavaScript Vanilla no frontend.

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
- Integração direta com banco de dados  

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
- Exclusão de usuários  
- Visualização geral do sistema  
- Acesso a dashboard global  

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

### Backend
- Node.js  
- Express  
- SQLite  
- Express-session  
- Bcrypt (hash de senha)  
- Middleware de autenticação  

### Frontend
- HTML5  
- CSS3  
- JavaScript Vanilla  
- FullCalendar  

---

## 📁 Estrutura Atual do Projeto

```bash
barberpro/
│
├── admin/
│   ├── admin.html
│   ├── admin-bloqueios.html
│   └── admin-total.html
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── script-cliente.js
│   ├── script-admin.js
│   ├── script-dashboard.js
│   └── style.css
│
├── routes/
│   └── agendamentos.js
│
├── middleware/
│   └── auth.js
│
├── database.js
├── database.sqlite
├── server.js
├── package.json
└── .gitignore
```
---

## 🔄 Fluxo do Sistema

### Cliente

1. Seleciona o barbeiro  
2. Escolhe uma data  
3. Backend retorna horários disponíveis  
4. Sistema valida conflitos e bloqueios  
5. Agendamento é salvo vinculado ao barbeiro  

### Barbeiro

1. Realiza login  
2. Visualiza apenas seus agendamentos  
3. Pode finalizar ou excluir  
4. Gerencia seus próprios serviços  
5. Acompanha faturamento individual  

### Admin Total

1. Realiza login  
2. Gerencia usuários  
3. Acompanha dados gerais do sistema  
4. Controla acesso ao sistema  

---

## 🔐 Sistema de Segurança

- Senhas criptografadas com bcrypt  
- Sessões via express-session  
- Middleware de verificação de login  
- Middleware de verificação por role  
- Proteção de rotas administrativas  
- Respostas HTTP padronizadas (400, 401, 403, 409, 500)  

---

## 💻 Como Executar

npm install  
node server.js  

Acessar no navegador:  
http://localhost:3000  

---

## 📚 Conceitos Aplicados

- Arquitetura backend modular  
- Middleware de autenticação e autorização  
- Controle de acesso baseado em roles  
- CRUD completo com SQLite  
- Integração frontend + backend via API REST  
- Controle de estado com sessões  
- Separação de responsabilidades  
- Estruturação real de sistema SaaS  

---

## 🎯 Objetivo

Projeto criado para prática real de desenvolvimento full stack, simulando um sistema profissional de agendamento para barbearias com controle administrativo completo.

---

💈 BarberPro  
Desenvolvido por Leonardo Antunes  