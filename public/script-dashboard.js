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

  if (document.getElementById("lista")) carregarAgendamentos();
  if (document.getElementById("faturamento")) carregarFaturamento();
  if (document.getElementById("listaServicos")) carregarServicos();
  if (document.getElementById("tabelaUsuarios")) carregarUsuarios();

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

    if (item.finalizado === 1) tr.style.backgroundColor = "#d4edda";

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

  const res = await fetch("/api/agendamentos/" + id, { method: "DELETE" });
  if (!res.ok) return alert("Erro ao excluir agendamento");

  carregarAgendamentos();
  carregarFaturamento();
}

async function finalizar(id) {
  const res = await fetch("/api/agendamentos/finalizar/" + id, { method: "PUT" });
  if (!res.ok) return alert("Erro ao finalizar agendamento");

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
      ${servico.nome} - R$ ${Number(servico.preco).toFixed(2)}
      <button onclick="excluirServico(${servico.id})">Excluir</button>
    `;
    lista.appendChild(li);
  });
}

async function excluirServico(id) {
  const res = await fetch(`/api/servicos/${id}`, { method: "DELETE" });
  if (!res.ok) return alert("Erro ao excluir serviço");

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
  <button onclick="editarUsuario(${user.id}, '${user.usuario}', '${user.role}')">Editar</button>
  ${user.id !== 1
          ? `<button onclick="excluirUsuario(${user.id})">Excluir</button>`
          : `<span>Admin Principal</span>`}
</td>
      `;

      tabela.appendChild(linha);
    });

  } catch (erro) {
    console.error("Erro ao carregar usuarios:", erro);
  }
}

async function excluirUsuario(id) {
  if (id === 1) return alert("Não é permitido excluir o admin principal");
  if (!confirm("Tem certeza que deseja excluir?")) return;

  const res = await fetch(`/api/agendamentos/usuarios/${id}`, { method: "DELETE" });
  if (!res.ok) return alert("Erro ao excluir usuário");

  carregarUsuarios();
}

window.excluirUsuario = excluirUsuario;

const formNovoUsuario = document.getElementById("formNovoUsuario");

if (formNovoUsuario) {
  formNovoUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.getElementById("novoUsuario").value.trim();
    const senha = document.getElementById("novaSenha").value.trim();
    const role = document.getElementById("novaRole").value;

    if (!usuario || !senha || !role) return alert("Preencha todos os campos");

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha, role })
    });

    if (!res.ok) return alert("Erro ao criar usuário");

    e.target.reset();
    carregarUsuarios();
  });
}

// =========================
// 🔄 LOGICA DO MODAL DE EDIÇÃO
// =========================

const modal = document.getElementById("modalEditar");

// 1. Função que abre o modal e preenche os campos
async function editarUsuario(id, nomeAtual, roleAtual) {
  document.getElementById("editId").value = id;
  document.getElementById("editNome").value = nomeAtual;
  document.getElementById("editRole").value = roleAtual;
  document.getElementById("editSenha").value = "";

  // Se for o Admin Principal (ID 1), esconde a opção de mudar Role
  const groupRole = document.getElementById("groupRole");
  if (id === 1) {
    groupRole.style.display = "none";
  } else {
    groupRole.style.display = "block";
  }

  modal.style.display = "block";
}

// 2. Função para fechar
function fecharModal() {
  modal.style.display = "none";
}

// 3. Envio dos dados (Submit do Form dentro do Modal)
document.getElementById("formEdicaoUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (formNovoUsuario) {
    formNovoUsuario.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editId").value;
      const usuario = document.getElementById("editNome").value.trim();
      const role = document.getElementById("editRole").value;
      const novaSenha = document.getElementById("editSenha").value.trim();

      const dadosParaEnviar = { usuario, role };
      if (novaSenha) {
        dadosParaEnviar.senha = novaSenha;
      }

      try {
        const res = await fetch(`/api/admin/usuarios/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dadosParaEnviar)
        });

        if (res.ok) {
          fecharModal();
          carregarUsuarios(); // Recarrega a tabela
        } else {
          alert("Erro ao atualizar usuário");
        }
      } catch {
        console.error("Erro na requisicao:", err);
        alert("Erro de conexao com o servidor")
      }
    });
  }

  // Garante que as funções estão no escopo global para os botões da tabela
  window.editarUsuario = editarUsuario;
  window.fecharModal = fecharModal;


  // =========================
  //   ADICIONAR SERVICO
  // =========================

  const formServico = document.getElementById("formServico");

  if (formServico) {
    formServico.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nomeServico").value.trim();
      const preco = document.getElementById("precoServico").value.trim();

      if (!nome || !preco) return alert("Preencha todos os campos");

      const res = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, preco })
      });

      if (!res.ok) return alert("Erro ao adicionar serviço");

      e.target.reset();
      carregarServicos();
    });
  }
});