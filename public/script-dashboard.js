// =========================
// 🔐 VERIFICA USUÁRIO LOGADO
// =========================

document.addEventListener("DOMContentLoaded", async () => {

  try {
    const respostaUsuario = await fetch("/api/usuario-logado");

    if (!respostaUsuario.ok) {
      window.location.href = "/login.html";
      return;
    }

    const usuario = await respostaUsuario.json();

    const btnAdmin = document.getElementById("btnAdminTotal");
    if (btnAdmin && usuario.role === "admin") {
      btnAdmin.style.display = "block";
    }

  } catch (erro) {
    console.error("Erro ao verificar usuário:", erro);
  }

  // =========================
  // 🚀 CARREGA FUNÇÕES CONFORME A PÁGINA
  // =========================

  if (document.getElementById("lista")) {
    carregarAgendamentos();
  }

  if (document.getElementById("faturamento")) {
    carregarFaturamento();
  }

  if (document.getElementById("listaServicos")) {
    carregarServicos();
  }

  if (document.getElementById("tabelaUsuarios")) {
    carregarUsuarios();
  }

});


// =========================
// 📅 AGENDAMENTOS
// =========================

async function carregarAgendamentos() {

  const lista = document.getElementById("lista");
  const total = document.getElementById("total");
  const hoje = document.getElementById("hoje");

  if (!lista || !total || !hoje) return;

  const resposta = await fetch("/api/agendamentos");
  const dados = await resposta.json();

  lista.innerHTML = "";
  total.textContent = dados.length;

  const hojeData = new Date().toISOString().split("T")[0];
  let countHoje = 0;

  dados.forEach(item => {

    if (item.data === hojeData) countHoje++;

    const tr = document.createElement("tr");

    if (item.finalizado === 1) {
      tr.style.backgroundColor = "#d4edda";
    }

    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.telefone}</td>
      <td>${item.servico}</td>
      <td>${item.data}</td>
      <td>${item.horario}</td>
      <td>
        ${item.finalizado === 0
        ? `<button onclick="finalizar(${item.id})">Finalizar</button>`
        : `<span style="color:green;font-weight:bold;">✔ Pago</span>`}
        <button onclick="excluir(${item.id})">Excluir</button>
      </td>
    `;

    lista.appendChild(tr);
  });

  hoje.textContent = countHoje;
}

async function excluir(id) {
  if (!confirm("Deseja realmente excluir?")) return;

  await fetch("/api/agendamentos/" + id, { method: "DELETE" });

  carregarAgendamentos();
  carregarFaturamento();
}

async function finalizar(id) {
  await fetch("/api/agendamentos/finalizar/" + id, { method: "PUT" });

  carregarAgendamentos();
  carregarFaturamento();
}

window.excluir = excluir;
window.finalizar = finalizar;


// =========================
// 💰 FATURAMENTO
// =========================

async function carregarFaturamento() {

  const elemento = document.getElementById("faturamento");
  if (!elemento) return;

  const resposta = await fetch("/api/agendamentos/faturamento");
  const dados = await resposta.json();

  elemento.textContent = "R$ " + Number(dados.total).toFixed(2);
}


// =========================
// ✂️ SERVIÇOS
// =========================

async function carregarServicos() {

  const lista = document.getElementById("listaServicos");
  if (!lista) return;

  const res = await fetch("/api/servicos");
  const servicos = await res.json();

  lista.innerHTML = "";

  servicos.forEach(servico => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${servico.nome} - R$ ${servico.preco}
      <button onclick="excluirServico(${servico.id})">Excluir</button>
    `;

    lista.appendChild(li);
  });
}

async function excluirServico(id) {
  await fetch(`/api/servicos/${id}`, { method: "DELETE" });
  carregarServicos();
}

window.excluirServico = excluirServico;


// =========================
// 👑 USUÁRIOS (ADMIN TOTAL)
// =========================

async function carregarUsuarios() {

  const tabela = document.getElementById("tabelaUsuarios");
  if (!tabela) return;

  try {
    const res = await fetch("/api/admin/usuarios");
    const usuarios = await res.json();

    tabela.innerHTML = "";

    usuarios.forEach(user => {

      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>${user.id}</td>
        <td>${user.usuario}</td>
        <td>${user.role}</td>
        <td>
          <button onclick="excluirUsuario(${user.id})">
            Excluir
          </button>
        </td>
      `;

      tabela.appendChild(linha);
    });

  } catch (erro) {
    console.error("Erro ao carregar usuarios:", erro);
  }
}

async function excluirUsuario(id) {
  if (!confirm("Tem certeza que deseja excluir?")) return;

  await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });

  carregarUsuarios();
}

window.excluirUsuario = excluirUsuario;

const formNovoUsuario = document.getElementById("formNovoUsuario");

if (formNovoUsuario) {
  formNovoUsuario.addEventListener("submit", async (e) => {
    e. preventDefault();

    const usuario = document.getElementById("novoUsuario").value;
    const senha = document.getElementById("novaSenha").value;
    const role = document.getElementById("novaRole").value;

    await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario, senha, role })
    });

    e.target.reset();

    carregarUsuarios();
  });
}

// =========================
//   ADICIONAR SERVICO
// =========================

const formServico = document.getElementById("formServico");

if (formServico) {
  formServico.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeServico").value;
    const preco = document.getElementById("precoServico").value;

    await fetch("/api/servicos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nome, preco })
    });

    e.target.reset();

    carregarServicos();
  });
}