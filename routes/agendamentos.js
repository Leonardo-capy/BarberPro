import express from "express";

export function agendamentoRoutes(db) {
  const router = express.Router();

  const horariosFixos = [
    "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  // ===============================
  // Criar agendamento
  // ===============================
  router.post("/", async (req, res) => {
    try {
      const { nome, telefone, servico, data, horario } = req.body;

      if (!nome || !telefone || !servico || !data || !horario) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }

      // Verificar se está bloqueado
      const bloqueado = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND horario = ?",
        [data, horario]
      );

      if (bloqueado) {
        return res.status(403).json({ error: "Horário bloqueado pelo barbeiro." });
      }

      // Verificar conflito
      const conflito = await db.get(
        "SELECT * FROM agendamentos WHERE data = ? AND horario = ?",
        [data, horario]
      );

      if (conflito) {
        return res.status(409).json({ error: "Horário já está reservado." });
      }

      await db.run(
        `INSERT INTO agendamentos (nome, telefone, servico, data, horario)
         VALUES (?, ?, ?, ?, ?)`,
        [nome, telefone, servico, data, horario]
      );

      res.status(201).json({ message: "Agendamento realizado com sucesso!" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

  // ===============================
  // Buscar horários disponíveis
  // ===============================
  router.get("/disponiveis/:data", async (req, res) => {
    try {
      const { data } = req.params;

      const agendados = await db.all(
        "SELECT horario FROM agendamentos WHERE data = ?",
        [data]
      );

      const bloqueados = await db.all(
        "SELECT horario FROM bloqueios WHERE data = ?",
        [data]
      );

      const ocupados = agendados.map(a => a.horario);
      const indisponiveis = bloqueados.map(b => b.horario);

      const todosIndisponiveis = [...ocupados, ...indisponiveis];

      const disponiveis = horariosFixos.filter(
        h => !todosIndisponiveis.includes(h)
      );

      res.json(disponiveis);

    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar horários." });
    }
  });

  // ===============================
  // Bloquear horário (Barbeiro)
  // ===============================
  
router.post("/toggle-bloqueio", async (req, res) => {
  try {
    const { data, horario } = req.body;

    const existe = await db.get(
      "SELECT * FROM bloqueios WHERE data = ? AND horario = ?",
      [data, horario]
    );

    if (existe) {
      await db.run(
        "DELETE FROM bloqueios WHERE data = ? AND horario = ?",
        [data, horario]
      );
      return res.json({ status: "desbloqueado" });
    } else {
      await db.run(
        "INSERT INTO bloqueios (data, horario) VALUES (?, ?)",
        [data, horario]
      );
      return res.json({ status: "bloqueado" });
    }

  } catch {
    res.status(500).json({ error: "Erro ao alternar bloqueio." });
  }
});


  router.get("/bloqueios/:data", async (req, res) => {
  try {
    const { data } = req.params;

    const bloqueados = await db.all(
      "SELECT horario FROM bloqueios WHERE data = ?",
      [data]
    );

    res.json(bloqueados.map(b => b.horario));

  } catch {
    res.status(500).json({ error: "Erro ao buscar bloqueios." });
  }
});

  // ===============================
  // Excluir agendamento
  // ===============================
  router.delete("/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM agendamentos WHERE id = ?", [req.params.id]);
      res.json({ message: "Agendamento excluído." });
    } catch {
      res.status(500).json({ error: "Erro ao excluir." });
    }
  });

  // ===============================
  // Listar agendamentos
  // ===============================
  router.get("/", async (req, res) => {
    try {
      const agendamentos = await db.all(
        "SELECT * FROM agendamentos ORDER BY data, horario"
      );
      res.json(agendamentos);
    } catch {
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  });

  return router;
}