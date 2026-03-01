import express from "express";

export function agendamentoRoutes(db) {
  const router = express.Router();

  const horariosFixos = [
    "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00",
    "16:00", "17:00"
  ];

  function verificarLogin(req, res, next) {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    next();
  }

  // ===============================
  // Bloquear dia inteiro
  // ===============================

  router.post("/bloquear-dia", verificarLogin, async (req, res) => {
    try {
      const { data } = req.body;
      const userId = req.session.userId

      if (!data) {
        return res.status(400).json({ error: "Data é obrigatoria." });
      }

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado."})
      }

      const jaBloqueado = await db.get(
        "SELECT id FROM bloqueios WHERE user_id = ? AND data = ? AND horario =?",
        [userId, data, "DIA_INTEIRO"]
      );
      if (jaBloqueado) {
        await db.run(
          "DELETE FROM bloqueios WHERE user_id = ? AND data = ? AND horario = ?",
          [userId, data, "DIA_INTEIRO"]
        );
        return res.json({ status: "desbloqueado", message: "Dia desbloqueado com sucesso!"});
      }
      await db.run(
        "DELETE FROM bloqueios WHERE user_id = ? AND data = ?",
        [userId, data]
      );

      await db.run(
        "INSERT INTO bloqueios (user_id, data, horario) VALUES (?, ?, ?)",
        [userId, data, "DIA_INTEIRO"]
      );

      res.json({ message: "Dia bloqueado com sucesso!" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao bloquear/desbloquear dia."});
      alert("erro ao bloquear/desbloquear dia", error);
    }
  });

router.get("/bloqueios/:data", verificarLogin, async (req, res) =>{
  try {
    const { data } = req.params;
    const userId = req.session.userId;

    const bloqueios = await db.all(
      "SELECT horario FROM bloqueios WHERE data = ? AND user_id = ?",
      [data, userId]
    );

    const horarios = bloqueios.map(b => b.horario);

    res.json(horarios);
  } catch (error){
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar bloqueios."});
  }
});


  // ===============================
  // Criar agendamento
  // ===============================
  router.post("/", async (req, res) => {
    try {
      const { nome, telefone, servico_id, data, horario, user_id } = req.body;
      const userId = Number(user_id);

      if (!nome || !telefone || !servico_id || !data || !horario) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }

      const bloqueado = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?",
        [data, horario, userId]
      );

      if (bloqueado) {
        return res.status(403).json({ error: "Horário bloqueado pelo barbeiro." });
      }
      const bloqueioDia = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND user_id = ? AND horario = ?",
        [data, userId, "DIA_INTEIRO"]
      );
      if (bloqueioDia) {
        return res.status(403).json({ error: "Este dia está bloqueado"});
      }

      const conflito = await db.get(
        "SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND user_id = ?",
        [data, horario, userId]
      );

      if (conflito) {
        return res.status(409).json({ error: "Horário já está reservado." });
      }

      const servicoDB = await db.get(
        "SELECT nome, preco FROM servicos WHERE id = ? AND user_id = ?",
        [servico_id, userId]
      );

      if (!servicoDB) {
        return res.status(400).json({ error: "Serviço inválido."})
      }

      await db.run(
        `INSERT INTO agendamentos 
        (user_id, nome, telefone, servico, preco, servico_id, data, horario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, 
          nome, 
          telefone,
          servicoDB.nome,
          servicoDB.preco,
          servico_id, 
          data, 
          horario
        ]
      );

      res.status(201).json({ message: "Agendamento realizado com sucesso!" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

  // ===============================
  // Criar serviço
  // ===============================

  router.post("/servicos", verificarLogin, async (req, res) => {
    const { nome, preco } = req.body;
    const userId = req.session.userId;
    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [userId, nome, preco]
    );

    res.json({ message: "Serviço criado"});
  });

  // ===============================
  // Criar serviço
  // ===============================

  router.get("/servicos", async (req, res) => {
    const userId = req.query.user_id;

    const servicos = await db.all(
      "SELECT * FROM servicos WHERE user_id = ?",
      [userId]
    );

    res.json(servicos);
  });

  // ===============================
  // Finalizar atendimento (VALIDA PAGAMENTO)
  // ===============================
  router.put("/finalizar/:id", verificarLogin, async (req, res) => {
    try {
      const userId = req.session.userId;

      await db.run(
        "UPDATE agendamentos SET finalizado = 1 WHERE id = ? AND user_id = ?",
        [req.params.id, userId]
      );

      res.json({ message: "Atendimento finalizado com sucesso." });

    } catch {
      res.status(500).json({ error: "Erro ao finalizar." });
    }
  });

  // ===============================
  // Buscar horários disponíveis
  // ===============================
  router.get("/disponiveis/:data", async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.query.user_id;
      const bloqueioTotal = await db.get(
        "SELECT * FROM bloqueios WHERE data = ? AND user_id = ? AND horario = ?",
        [data, userId, "DIA_INTEIRO"]
      );

      if (bloqueioTotal) {
        return res.json([]);
      }

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

  // ===============================
  // Faturamento total (somente finalizados)
  // ===============================
  router.get("/faturamento", verificarLogin, async (req, res) => {
    try {
      const userId = req.session.userId;

      const total = await db.get(
        "SELECT SUM(preco) as total FROM agendamentos WHERE user_id = ? AND finalizado = 1",
        [userId]
      );

      res.json({ total: total.total || 0 });

    } catch {
      res.status(500).json({ error: "Erro ao calcular faturamento." });
    }
  });

  return router;
}