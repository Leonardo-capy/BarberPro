import express from "express";
import cors from "cors";
import { initDB } from "./database.js";
import { agendamentoRoutes } from "./routes/agendamentos.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

async function startServer() {
  const db = await initDB();

  app.use("/api/agendamentos", agendamentoRoutes(db));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

app.post("/api/bloqueios", async (req, res) => {

  const { data, horarios } = req.body;

  if (!data || !horarios || horarios.length === 0) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  const db = await initDB();

  for (const horario of horarios) {
    await db.run(
      "INSERT INTO bloqueios (data, horario) VALUES (?, ?)",
      [data, horario]
    );
  }

  res.json({ message: "Horários bloqueados com sucesso!" });
});

app.post("/agendar", async (req, res) => {
  const { nome, telefone, servico, data, horario } = req.body;

  if (!nome || !telefone || !servico || !data || !horario) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }

  // 🔒 Bloquear domingos
  const diaSelecionado = new Date(data + "T00:00:00");
  const diaSemana = diaSelecionado.getDay(); // 0 = domingo

  if (diaSemana === 0) {
    return res.status(400).json({ error: "Não trabalhamos aos domingos." });
  }

  await db.run(
    `INSERT INTO agendamentos (nome, telefone, servico, data, horario)
     VALUES (?, ?, ?, ?, ?)`,
    [nome, telefone, servico, data, horario]
  );

  res.json({ message: "Agendamento realizado com sucesso!" });
});

startServer();