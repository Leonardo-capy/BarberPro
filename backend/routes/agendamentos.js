import express from "express";
import { verificarLogin } from "../middleware/auth.js";

export function agendamentoRoutes(db) {
  const router = express.Router();

  const horariosFixos = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  async function isHorarioBloqueado(userId, barbeariaId, data, horario) {
    const bloqueio = await db.get(
      "SELECT * FROM bloqueios WHERE data = $1 AND user_id = $2 AND barbearia_id = $3 AND (horario = $4 OR horario = 'DIA_INTEIRO')",
      [data, userId, barbeariaId, horario]
    );
    return !!bloqueio;
  }

  async function getServico(userId, barbeariaId, servico_id) {
    return db.get(
      "SELECT nome, preco FROM servicos WHERE id = $1 AND user_id = $2 AND barbearia_id = $3",
      [servico_id, userId, barbeariaId]
    );
  }

  // ===============================
  // Bloquear/desbloquear dia inteiro
  // ===============================
  router.post("/bloquear-dia", verificarLogin, async (req, res) => {
    try {
      const { data } = req.body;
      const userId = req.session.userId;
      const barbeariaId = req.session.usuario.barbearia_id;

      if (!data) return res.status(400).json({ error: "Data é obrigatória." });

      const jaBloqueado = await db.get(
        "SELECT id FROM bloqueios WHERE user_id = $1 AND barbearia_id = $2 AND data = $3 AND horario = 'DIA_INTEIRO'",
        [userId, barbeariaId, data]
      );

      if (jaBloqueado) {
        await db.run(
          "DELETE FROM bloqueios WHERE user_id = $1 AND barbearia_id = $2 AND data = $3 AND horario = 'DIA_INTEIRO'",
          [userId, barbeariaId, data]
        );
        return res.json({ bloqueado: false, message: "Dia desbloqueado!" });
      }

      await db.run(
        "DELETE FROM bloqueios WHERE user_id = $1 AND barbearia_id = $2 AND data = $3",
        [userId, barbeariaId, data]
      );
      await db.run(
        "INSERT INTO bloqueios (user_id, barbearia_id, data, horario) VALUES ($1, $2, $3, 'DIA_INTEIRO')",
        [userId, barbeariaId, data]
      );
      res.json({ bloqueado: true, message: "Dia bloqueado!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao bloquear/desbloquear dia." });
    }
  });

  router.get("/bloqueios/:data", verificarLogin, async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.session.userId;
      const barbeariaId = req.session.usuario.barbearia_id;
      const bloqueios = await db.all(
        "SELECT horario FROM bloqueios WHERE data = $1 AND user_id = $2 AND barbearia_id = $3",
        [data, userId, barbeariaId]
      );
      res.json(bloqueios.map(b => b.horario));
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar bloqueios." });
    }
  });

  // ===============================
  // Criar agendamento (público)
  // ===============================
  router.post("/", async (req, res) => {
    try {
      let { nome, telefone, servico, data, horario, user_id, barbearia_id } = req.body;
      const userId = Number(user_id);
      const barbeariaId = Number(barbearia_id);

      if (!nome || !telefone || !servico || !data || !horario)
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });

      nome = String(nome).trim();
      telefone = String(telefone).replace(/\D/g, '');

      if (nome.length < 2)
        return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
      if (telefone.length < 10 || telefone.length > 11)
        return res.status(400).json({ error: "Telefone inválido. Use DDD + número (10 ou 11 dígitos)." });
      if (!userId || isNaN(userId))
        return res.status(400).json({ error: "Barbeiro inválido." });
      if (!barbeariaId || isNaN(barbeariaId))
        return res.status(400).json({ error: "Barbearia inválida." });

      if (await isHorarioBloqueado(userId, barbeariaId, data, horario))
        return res.status(403).json({ error: "Horário ou dia bloqueado." });

      const conflito = await db.get(
        "SELECT * FROM agendamentos WHERE data = $1 AND horario = $2 AND user_id = $3 AND barbearia_id = $4",
        [data, horario, userId, barbeariaId]
      );
      if (conflito) return res.status(409).json({ error: "Horário já reservado." });

      const servicoDB = await getServico(userId, barbeariaId, servico);
      if (!servicoDB) return res.status(400).json({ error: "Serviço inválido." });

      await db.run(
        `INSERT INTO agendamentos (barbearia_id, user_id, nome, telefone, servico, preco, data, horario)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [barbeariaId, userId, nome, telefone, servicoDB.nome, servicoDB.preco, data, horario]
      );

      res.status(201).json({ message: "Agendamento realizado com sucesso!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

  // ===============================
  // Serviços por barbeiro (público)
  // ===============================
  router.get("/servicos", async (req, res) => {
    try {
      const userId = req.query.user_id;
      const barbeariaId = req.query.barbearia_id;
      const servicos = await db.all(
        "SELECT * FROM servicos WHERE user_id = $1 AND barbearia_id = $2",
        [userId, barbeariaId]
      );
      res.json(servicos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar serviços." });
    }
  });

  router.post("/servicos", verificarLogin, async (req, res) => {
    try {
      const { nome, preco } = req.body;
      const barbeariaId = req.session.usuario.barbearia_id;
      await db.run(
        "INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES ($1, $2, $3, $4)",
        [barbeariaId, req.session.userId, nome, preco]
      );
      res.json({ message: "Serviço criado." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao criar serviço." });
    }
  });

  // ===============================
  // Finalizar, excluir e listar agendamentos
  // ===============================
  router.put("/finalizar/:id", verificarLogin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;
      await db.run(
        "UPDATE agendamentos SET finalizado = 1 WHERE id = $1 AND user_id = $2 AND barbearia_id = $3",
        [req.params.id, req.session.userId, barbeariaId]
      );
      res.json({ message: "Atendimento finalizado!" });
    } catch {
      res.status(500).json({ error: "Erro ao finalizar." });
    }
  });

  router.delete("/:id", verificarLogin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;
      await db.run(
        "DELETE FROM agendamentos WHERE id = $1 AND user_id = $2 AND barbearia_id = $3",
        [req.params.id, req.session.userId, barbeariaId]
      );
      res.json({ message: "Agendamento excluído." });
    } catch {
      res.status(500).json({ error: "Erro ao excluir." });
    }
  });

  router.get("/", verificarLogin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;
      const agendamentos = await db.all(
        "SELECT * FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 ORDER BY data, horario",
        [req.session.userId, barbeariaId]
      );
      res.json(agendamentos);
    } catch {
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  });

  // ===============================
  // Horários disponíveis (público)
  // ===============================
  router.get("/disponiveis/:data", async (req, res) => {
    try {
      const { data } = req.params;
      const userId = req.query.user_id;
      const barbeariaId = req.query.barbearia_id;

      const diaInteiro = await db.get(
        "SELECT id FROM bloqueios WHERE user_id = $1 AND barbearia_id = $2 AND data = $3 AND horario = 'DIA_INTEIRO'",
        [userId, barbeariaId, data]
      );
      if (diaInteiro) return res.json([]);

      const agendados = (await db.all(
        "SELECT horario FROM agendamentos WHERE data = $1 AND user_id = $2 AND barbearia_id = $3",
        [data, userId, barbeariaId]
      )).map(a => a.horario);

      const bloqueados = (await db.all(
        "SELECT horario FROM bloqueios WHERE data = $1 AND user_id = $2 AND barbearia_id = $3",
        [data, userId, barbeariaId]
      )).map(b => b.horario);

      const indisponiveis = [...agendados, ...bloqueados];
      res.json(horariosFixos.filter(h => !indisponiveis.includes(h)));
    } catch (err) {
      console.error(err);
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
      const barbeariaId = req.session.usuario.barbearia_id;

      const existe = await db.get(
        "SELECT * FROM bloqueios WHERE data = $1 AND horario = $2 AND user_id = $3 AND barbearia_id = $4",
        [data, horario, userId, barbeariaId]
      );

      if (existe) {
        await db.run(
          "DELETE FROM bloqueios WHERE data = $1 AND horario = $2 AND user_id = $3 AND barbearia_id = $4",
          [data, horario, userId, barbeariaId]
        );
        res.json({ status: "desbloqueado" });
      } else {
        await db.run(
          "INSERT INTO bloqueios (barbearia_id, user_id, data, horario) VALUES ($1, $2, $3, $4)",
          [barbeariaId, userId, data, horario]
        );
        res.json({ status: "bloqueado" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao alternar bloqueio." });
    }
  });

  // ===============================
  // Faturamento (diário, mensal, anual, total)
  // ===============================
  router.get("/faturamento", verificarLogin, async (req, res) => {
    try {
      const userId = req.session.userId;
      const barbeariaId = req.session.usuario.barbearia_id;
      const hoje = new Date();
      const diaHoje = hoje.toISOString().split('T')[0];
      const mesHoje = diaHoje.substring(0, 7);
      const anoHoje = diaHoje.substring(0, 4);

      const [total, diario, mensal, anual] = await Promise.all([
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1", [userId, barbeariaId]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1 AND data = $3", [userId, barbeariaId, diaHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1 AND TO_CHAR(data::date, 'YYYY-MM') = $3", [userId, barbeariaId, mesHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1 AND TO_CHAR(data::date, 'YYYY') = $3", [userId, barbeariaId, anoHoje]),
      ]);

      res.json({
        total:  total?.total  || 0,
        diario: diario?.total || 0,
        mensal: mensal?.total || 0,
        anual:  anual?.total  || 0,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao calcular faturamento." });
    }
  });

  return router;
}