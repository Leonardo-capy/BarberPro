import express from "express";

export function agendamentoRoutes(db) {
  const router = express.Router();

  const horariosFixos = [
    "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  // Middleware interno de proteção
  function verificarLogin(req, res, next) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    next();
  }

  // ===============================
  // Criar agendamento
  // ===============================
  router.post("/", async (req, res) => {
    try {
      const { nome, telefone, servico, data, horario, user_id } = req.body;
      const userId = Number(user_id);

      if (!nome || !telefone || !servico || !data || !horario) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }

      const bloqueado = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?",
        [data, horario, userId]
      );

      if (bloqueado) {
        return res.status(403).json({ error: "Horário bloqueado pelo barbeiro." });
      }

      const conflito = await db.get(
        "SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND user_id = ?",
        [data, horario, userId]
      );

      if (conflito) {
        return res.status(409).json({ error: "Horário já está reservado." });
      }

      await db.run(
        `INSERT INTO agendamentos 
        (user_id, nome, telefone, servico, data, horario)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, nome, telefone, servico, data, horario]
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
      const userId = req.query.user_id;

      const agendados = await db.all(
        "SELECT horario FROM agendamentos WHERE data = ? AND user_id = ?",
        [data, userId]
      );

      const bloqueados = await db.all(
        "SELECT horario FROM bloqueios WHERE data = ? AND user_id = ?",
        [data, userId]
      );

      const ocupados = agendados.map(a => a.horario);
      const indisponiveis = bloqueados.map(b => b.horario);

      const todosIndisponiveis = [...ocupados, ...indisponiveis];

      const disponiveis = horariosFixos.filter(
        h => !todosIndisponiveis.includes(h)
      );

      res.json(disponiveis);

    } catch {
      res.status(500).json({ error: "Erro ao buscar horários." });
    }
  });

  // ===============================
  // Toggle bloqueio
  // ===============================
  router.post("/toggle-bloqueio", verificarLogin, async (req, res) => {
    try {
      const { data, horario } = req.body;
      const userId = req.session.userId;

      const existe = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?",
        [data, horario, userId]
      );

      if (existe) {
        await db.run(
          "DELETE FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?",
          [data, horario, userId]
        );
        return res.json({ status: "desbloqueado" });
      } else {
        await db.run(
          "INSERT INTO bloqueios (user_id, data, horario) VALUES (?, ?, ?)",
          [userId, data, horario]
        );
        return res.json({ status: "bloqueado" });
      }

    } catch {
      res.status(500).json({ error: "Erro ao alternar bloqueio." });
    }
  });

  // ===============================
  // Buscar bloqueios
  // ===============================
  router.get("/bloqueios/:data", verificarLogin, async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.session.userId;

      const bloqueados = await db.all(
        "SELECT horario FROM bloqueios WHERE data = ? AND user_id = ?",
        [data, userId]
      );

      res.json(bloqueados.map(b => b.horario));

    } catch {
      res.status(500).json({ error: "Erro ao buscar bloqueios." });
    }
  });

  // ===============================
  // Excluir agendamento
  // ===============================
  router.delete("/:id", verificarLogin, async (req, res) => {
    try {
      const userId = req.session.userId;

      await db.run(
        "DELETE FROM agendamentos WHERE id = ? AND user_id = ?",
        [req.params.id, userId]
      );

      res.json({ message: "Agendamento excluído." });

    } catch {
      res.status(500).json({ error: "Erro ao excluir." });
    }
  });

  // ===============================
  // Listar agendamentos
  // ===============================
  router.get("/", verificarLogin, async (req, res) => {
    try {
      const userId = req.session.userId;

      const agendamentos = await db.all(
        "SELECT * FROM agendamentos WHERE user_id = ? ORDER BY data, horario",
        [userId]
      );

      res.json(agendamentos);

    } catch {
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  });

  return router;
}