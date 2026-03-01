document.addEventListener("DOMContentLoaded", () => {
  carregarAgendamentos();
  carregarFaturamento();
});

async function carregarAgendamentos() {
  const resposta = await fetch("/api/agendamentos");
  const dados = await resposta.json();

  const lista = document.getElementById("lista");
  const total = document.getElementById("total");
  const hoje = document.getElementById("hoje");

  lista.innerHTML = "";
  total.textContent = dados.length;

  const hojeData = new Date().toISOString().split("T")[0];
  let countHoje = 0;

  dados.forEach(item => {
    if (item.data === hojeData) countHoje++;

    const tr = document.createElement("tr");

    // 🔥 Linha verde se finalizado
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
        ? `<button class="finalizar-btn" onclick="finalizar(${item.id})">
                Finalizar
              </button>`
        : `<span style="color:green;font-weight:bold;">✔ Pago</span>`
      }

        <button class="delete-btn" onclick="excluir(${item.id})">
          Excluir
        </button>
      </td>
    `;

    lista.appendChild(tr);
  });

  hoje.textContent = countHoje;
}

async function carregarServicos() {
  const res = await fetch("/api/servicos");
  const servicos = await res.json();

  const lista = document.getElementById("listaServicos");
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

document.getElementById("formServico")
.addEventListener("submit", async (e) => {
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

async function excluirServico(id) {
  await fetch(`/api/servicos/${id}`, {
    method: "DELETE"
  });

  carregarServicos();
}

carregarServicos();

async function excluir(id) {
  if (!confirm("Deseja realmente excluir?")) return;

  await fetch("/api/agendamentos/" + id, {
    method: "DELETE"
  });

  carregarAgendamentos();
  carregarFaturamento();
}

async function finalizar(id) {
  await fetch("/api/agendamentos/finalizar/" + id, {
    method: "PUT"
  });

  carregarAgendamentos();
  carregarFaturamento();
}

async function carregarFaturamento() {
  const resposta = await fetch("/api/agendamentos/faturamento");
  const dados = await resposta.json();

  document.getElementById("faturamento").textContent =
    "R$ " + Number(dados.total).toFixed(2);
}