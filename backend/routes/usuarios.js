import express from "express";
import { verificarAdmin, verificarLogin, verificarSuperAdmin } from "../middleware/auth.js";
import bcrypt from "bcrypt";

export function usuarioRoutes(db) {
  const router = express.Router();

  // Lista usuários da mesma barbearia (admin da barbearia)
  router.get("/", verificarAdmin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;
      const usuarios = await db.all(
        "SELECT id, usuario, role, plano FROM usuarios WHERE barbearia_id = ? ORDER BY id",
        [barbeariaId]
      );
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuarios" });
    }
  });

  // Busca usuário por id (próprio ou admin)
  router.get("/:id", verificarLogin, async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.session.usuario;

    if (usuarioLogado.role !== "admin" && usuarioLogado.role !== "superadmin" && Number(id) !== usuarioLogado.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const usuario = await db.get(
      "SELECT id, usuario, role, plano, descricao FROM usuarios WHERE id = ?",
      [id]
    );
    if (!usuario) return res.status(404).json({ error: "Usuario nao encontrado" });
    res.json(usuario);
  });

  // Atualizar usuário (admin da barbearia)
  router.put("/:id", verificarAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let { usuario, role, senha } = req.body;
      const barbeariaId = req.session.usuario.barbearia_id;

      if (usuario !== undefined && typeof usuario !== 'string')
        return res.status(400).json({ error: "Usuário deve ser uma string" });
      if (role !== undefined && typeof role !== 'string')
        return res.status(400).json({ error: "Role deve ser uma string" });
      if (senha !== undefined && senha !== null && typeof senha !== 'string')
        return res.status(400).json({ error: "Senha deve ser uma string" });

      if (usuario) usuario = usuario.trim();
      if (role) role = role.trim();
      if (senha) senha = senha.trim();

      if (!usuario || usuario.length < 3)
        return res.status(400).json({ error: "Usuário deve ter pelo menos 3 caracteres" });

      const rolesValidas = ['admin', 'barbeiro'];
      if (role && !rolesValidas.includes(role))
        return res.status(400).json({ error: "Role deve ser 'admin' ou 'barbeiro'" });

      if (senha && senha.length < 6)
        return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });

      const existente = await db.get("SELECT id FROM usuarios WHERE id = ? AND barbearia_id = ?", [id, barbeariaId]);
      if (!existente) return res.status(404).json({ error: "Usuário não encontrado" });

      if (role) {
        await db.run("UPDATE usuarios SET usuario = ?, role = ? WHERE id = ?", [usuario, role, id]);
      } else {
        await db.run("UPDATE usuarios SET usuario = ? WHERE id = ?", [usuario, id]);
      }

      if (senha) {
        const hash = await bcrypt.hash(senha, 10);
        await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, id]);
      }

      res.json({ success: true, message: "Usuário atualizado com sucesso." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
  });


  //deleta usuario
  router.delete("/:id", verificarAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const barbeariaId = req.session.usuario.barbearia_id;

      // CORREÇÃO DO BUG 1: Acessando o ID correto da sessão do usuário
      if (Number(id) === Number(req.session.usuario.id)) {
        return res.status(400).json({ error: "Voce nao pode excluir sua propria conta" });
      }

      // 1. Limpa os agendamentos vinculados a esse usuário
      await db.run("DELETE FROM agendamentos WHERE usuario_id = ?", [id]);

      // SE HOUVER TABELA DE FATURAMENTO OU OUTRA QUE USE usuario_id, LIMPE AQUI:
      // await db.run("DELETE FROM faturamento WHERE usuario_id = ?", [id]);
      // await db.run("DELETE FROM servicos_prestados WHERE barbeiro_id = ?", [id]);

      // 2. Agora sim, deleta o usuário com segurança
      const result = await db.run("DELETE FROM usuarios WHERE id = ? AND barbearia_id = ?", [id, barbeariaId]);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuario nao encontrado" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Erro interno ao deletar usuário:", err);
      
      // RETORNO DE SEGURANÇA: Mostra a mensagem real do SQLite no Front-end se algo prender
      res.status(500).json({ 
        error: "Erro ao excluir usuario", 
        detalhe: err.message || err 
      });
    }
  });

  // Atualizar perfil próprio
  router.put("/:id/perfil-completo", verificarLogin, async (req, res) => {
    try {
      const { id } = req.params;
      const { senhaAtual, novaSenha, descricao } = req.body;
      const eu = req.session.usuario;

      await db.run("UPDATE usuarios SET descricao = ? WHERE id = ?", [descricao, id]);

      if (novaSenha) {
        if (eu.role !== 'admin' && eu.role !== 'superadmin' || eu.id == id) {
          const user = await db.get("SELECT senha FROM usuarios WHERE id = ?", [id]);
          const valida = await bcrypt.compare(senhaAtual, user.senha);
          if (!valida) return res.status(400).json({ error: "Senha atual incorreta" });
        }
        const hash = await bcrypt.hash(novaSenha, 10);
        await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, id]);
      }

      res.json({ success: true, message: "Perfil atualizado!" });
    } catch (err) {
      res.status(500).json({ error: "Erro interno" });
    }
  });

  return router;
}