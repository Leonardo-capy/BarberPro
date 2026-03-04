import express from "express";
import { verificarLogin } from "../middleware/auth.js";

export function agendamentoRoutes(db) {
  const router = express.Router();

  const horariosFixos = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // ===============================
  // Funções helper internas
  // ===============================
  async function isHorarioBloqueado(userId, data, horario) {
    const bloqueio = await db.get(
      "SELECT * FROM bloqueios WHERE data = ? AND user_id = ? AND (horario = ? OR horario = 'DIA_INTEIRO')",
      [data, userId, horario]
    );
    return !!bloqueio;
  }

  async function getServico(userId, servico_id) {
    return db.get("SELECT nome, preco FROM servicos WHERE id = ? AND user_id = ?", [servico_id, userId]);
  }

  // ===============================
  // Bloquear/desbloquear dia inteiro
  // ===============================
  router.post("/bloquear-dia", verificarLogin, async (req, res) => {
    try {
      const { data } = req.body;
      const userId = req.session.userId;
      if (!data) return res.status(400).json({ error: "Data é obrigatória." });

      const jaBloqueado = await db.get(
        "SELECT id FROM bloqueios WHERE user_id = ? AND data = ? AND horario = 'DIA_INTEIRO'",
        [userId, data]
      );

      if (jaBloqueado) {
        await db.run("DELETE FROM bloqueios WHERE user_id = ? AND data = ? AND horario = 'DIA_INTEIRO'", [userId, data]);
        return res.json({ status: "desbloqueado", message: "Dia desbloqueado!" });
      }

      await db.run("DELETE FROM bloqueios WHERE user_id = ? AND data = ?", [userId, data]);
      await db.run("INSERT INTO bloqueios (user_id, data, horario) VALUES (?, ?, 'DIA_INTEIRO')", [userId, data]);
      res.json({ status: "bloqueado", message: "Dia bloqueado!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao bloquear/desbloquear dia." });
    }
  });

  router.get("/bloqueios/:data", verificarLogin, async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.session.userId;
      const bloqueios = await db.all("SELECT horario FROM bloqueios WHERE data = ? AND user_id = ?", [data, userId]);
      res.json(bloqueios.map(b => b.horario));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar bloqueios." });
    }
  });

  // ===============================
  // Criar agendamento
  // ===============================
  router.post("/", async (req, res) => {
    try {
      const { nome, telefone, servico, data, horario, user_id } = req.body;
      const userId = Number(user_id);
      if (!nome || !telefone || !servico || !data || !horario)
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });

      if (await isHorarioBloqueado(userId, data, horario))
        return res.status(403).json({ error: "Horário ou dia bloqueado." });

      const conflito = await db.get("SELECT * FROM agendamentos WHERE data = ? AND horario = ? AND user_id = ?", [data, horario, userId]);
      if (conflito) return res.status(409).json({ error: "Horário já reservado." });

      const servicoDB = await getServico(userId, servico);
      if (!servicoDB) return res.status(400).json({ error: "Serviço inválido." });

      await db.run(
        `INSERT INTO agendamentos (user_id, nome, telefone, servico, preco, servico, data, horario)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, nome, telefone, servicoDB.nome, servicoDB.preco, servico, data, horario]
      );

      res.status(201).json({ message: "Agendamento realizado com sucesso!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

  // ===============================
  // Serviços
  // ===============================
  router.post("/servicos", verificarLogin, async (req, res) => {
    const { nome, preco } = req.body;
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [req.session.userId, nome, preco]);
    res.json({ message: "Serviço criado." });
  });

  router.get("/servicos", async (req, res) => {
    const userId = req.query.user_id;
    const servicos = await db.all("SELECT * FROM servicos WHERE user_id = ?", [userId]);
    res.json(servicos);
  });

  // ===============================
  // Finalizar, excluir e listar agendamentos
  // ===============================
  router.put("/finalizar/:id", verificarLogin, async (req, res) => {
    try {
      await db.run("UPDATE agendamentos SET finalizado = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId]);
      res.json({ message: "Atendimento finalizado!" });
    } catch {
      res.status(500).json({ error: "Erro ao finalizar." });
    }
  });

  router.delete("/:id", verificarLogin, async (req, res) => {
    try {
      await db.run("DELETE FROM agendamentos WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId]);
      res.json({ message: "Agendamento excluído." });
    } catch {
      res.status(500).json({ error: "Erro ao excluir." });
    }
  });

  router.get("/", verificarLogin, async (req, res) => {
    try {
      const agendamentos = await db.all("SELECT * FROM agendamentos WHERE user_id = ? ORDER BY data, horario", [req.session.userId]);
      res.json(agendamentos);
    } catch {
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  });

  // ===============================
  // Horários disponíveis
  // ===============================
  router.get("/disponiveis/:data", async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.query.user_id;
      if (await isHorarioBloqueado(userId, data, "DIA_INTEIRO")) return res.json([]);

      const agendados = (await db.all("SELECT horario FROM agendamentos WHERE data = ? AND user_id = ?", [data, userId])).map(a => a.horario);
      const bloqueados = (await db.all("SELECT horario FROM bloqueios WHERE data = ? AND user_id = ?", [data, userId])).map(b => b.horario);

      const indisponiveis = [...agendados, ...bloqueados];
      res.json(horariosFixos.filter(h => !indisponiveis.includes(h)));
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
      const existe = await db.get("SELECT * FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?", [data, horario, userId]);

      if (existe) {
        await db.run("DELETE FROM bloqueios WHERE data = ? AND horario = ? AND user_id = ?", [data, horario, userId]);
        res.json({ status: "desbloqueado" });
      } else {
        await db.run("INSERT INTO bloqueios (user_id, data, horario) VALUES (?, ?, ?)", [userId, data, horario]);
        res.json({ status: "bloqueado" });
      }
    } catch {
      res.status(500).json({ error: "Erro ao alternar bloqueio." });
    }
  });

  // ===============================
  // Faturamento total
  // ===============================
  router.get("/faturamento", verificarLogin, async (req, res) => {
    try {
      const total = await db.get("SELECT SUM(preco) as total FROM agendamentos WHERE user_id = ? AND finalizado = 1", [req.session.userId]);
      res.json({ total: total.total || 0 });
    } catch {
      res.status(500).json({ error: "Erro ao calcular faturamento." });
    }
  });

  return router;
}