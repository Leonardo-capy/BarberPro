# 💈 BarberPro(Sujeito a mudança de nome) - Sistema de Agendamento para Barbearia

Sistema web de agendamento online para barbearias, desenvolvido com Node.js, Express e SQLite no backend, e HTML, CSS(css feito com Inteligencia Artificial-IA) e JavaScript puro no frontend.

Projeto focado em prática real de desenvolvimento full stack, com separação entre área pública (cliente) e área administrativa (barbeiro).

---

## 🚀 Funcionalidades Implementadas

### 🌍 Área do Cliente (Pública)

- Calendário interativo com FullCalendar
- Seleção de barbeiro
- Exibição dinâmica de horários disponíveis
- Bloqueio automático de domingos
- Desativação de horários passados no dia atual
- Validação de conflitos de agendamento
- Impedimento de agendamento em horários bloqueados
- Cadastro de agendamento vinculado ao barbeiro escolhido

---

### 🔐 Área Administrativa (Protegida por Sessão)

- Login de barbeiro
- Listagem de agendamentos do barbeiro logado
- Contador total de agendamentos
- Contador de agendamentos do dia
- Exclusão de agendamentos
- Sistema de bloqueio e desbloqueio de horários
- Visualização de bloqueios por data

---

## 🧠 Regras de Negócio

- Não permite agendamento em datas anteriores
- Não permite agendamento aos domingos
- Não permite dois agendamentos no mesmo horário
- Não permite agendamento em horário bloqueado
- Horários fixos definidos no backend
- Separação entre sistema público e sistema administrativo

---

## 🛠 Tecnologias Utilizadas

### Backend
- Node.js
- Express
- SQLite
- Express-session

### Frontend
- HTML5
- CSS3
- JavaScript Vanilla
- FullCalendar

---

## 📁 Estrutura do Projeto

```
barbearia-agenda/
│
├── admin/
│   ├── admin.html
│   └── admin-bloqueios.html
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── script-admin.js
│   ├── script-cliente.js
│   ├── script-dashboard.js
│   └── style.css
│
├── routes/
│   └── agendamentos.js
│
├── database.js
├── database.sqlite
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── anotacao
```

---

## 🔄 Fluxo do Sistema

### Cliente

1. Seleciona o barbeiro
2. Escolhe uma data no calendário
3. Sistema consulta horários disponíveis no backend
4. Cliente escolhe um horário
5. Sistema valida conflitos e bloqueios
6. Agendamento é salvo no banco de dados

### Administrador

1. Realiza login
2. Visualiza seus agendamentos
3. Pode excluir agendamentos
4. Pode bloquear ou desbloquear horários
5. Acompanha estatísticas básicas

---

## 💻 Como Executar o Projeto

1. Instalar dependências:
   npm install

2. Iniciar o servidor:
   node server.js

3. Acessar no navegador:
   http://localhost:3000

---

## 📚 Conceitos Aplicados

- Estruturação de rotas no Express
- Middleware de autenticação com sessão
- Manipulação de banco SQLite
- Integração frontend e backend
- Tratamento de erros HTTP (400, 401, 403, 409, 500)
- Controle de conflitos de agendamento
- Organização de projeto em camadas

---

## 🎯 Objetivo

Projeto desenvolvido para prática de desenvolvimento full stack e construção de um sistema real de mercado, simulando um produto profissional de agendamento para barbearias.

---

💈 BarberPro(Sujeito a mudança de nome)
Desenvolvido por Leonardo Antunes
