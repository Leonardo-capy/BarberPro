document.addEventListener("DOMContentLoaded", () => {
  carregarAgendamentos();
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
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.telefone}</td>
      <td>${item.servico}</td>
      <td>${item.data}</td>
      <td>${item.horario}</td>
      <td>
        <button class="delete-btn" onclick="excluir(${item.id})">
          Excluir
        </button>
      </td>
    `;

    lista.appendChild(tr);
  });

  hoje.textContent = countHoje;
}

async function excluir(id) {
  if (!confirm("Deseja realmente excluir?")) return;

  await fetch("/api/agendamentos/" + id, {
    method: "DELETE"
  });

  carregarAgendamentos();
}