import express from "express";
import { verificarSuperAdmin } from "../middleware/auth.js";

export function barbeariasRoutes(db) {
  const router = express.Router();

  // Lista todas as barbearias ativas (público)
  router.get("/", async (req, res) => {
    try {
      const barbearias = await db.all(
        "SELECT id, nome, slug, cidade FROM barbearias WHERE ativo = 1 ORDER BY nome"
      );
      res.json(barbearias);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar barbearias" });
    }
  });

  // Busca barbearia por slug (público)
  router.get("/:slug", async (req, res) => {
    try {
      const barbearia = await db.get(
        "SELECT id, nome, slug, cidade FROM barbearias WHERE slug = ? AND ativo = 1",
        [req.params.slug]
      );
      if (!barbearia) return res.status(404).json({ error: "Barbearia não encontrada" });
      res.json(barbearia);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar barbearia" });
    }
  });

  // Barbeiros ativos de uma barbearia (público)
  router.get("/:slug/barbeiros", async (req, res) => {
    try {
      const barbearia = await db.get(
        "SELECT id FROM barbearias WHERE slug = ? AND ativo = 1",
        [req.params.slug]
      );
      if (!barbearia) return res.status(404).json({ error: "Barbearia não encontrada" });

      const barbeiros = await db.all(
        "SELECT id, usuario FROM usuarios WHERE barbearia_id = ? AND plano = 'ativo' AND role != 'superadmin'",
        [barbearia.id]
      );
      res.json(barbeiros);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar barbeiros" });
    }
  });

  // ========================
  // Rotas de superadmin
  // ========================

  // Lista todas (inclusive inativas)
  router.get("/admin/todas", verificarSuperAdmin, async (req, res) => {
    try {
      const barbearias = await db.all(
        "SELECT * FROM barbearias ORDER BY nome"
      );
      res.json(barbearias);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar barbearias" });
    }
  });

  // Criar barbearia
  router.post("/", verificarSuperAdmin, async (req, res) => {
    try {
      let { nome, slug, cidade } = req.body;
      if (!nome || !slug) return res.status(400).json({ error: "Nome e slug são obrigatórios" });

      nome = nome.trim();
      slug = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      cidade = cidade?.trim() || null;

      const existe = await db.get("SELECT id FROM barbearias WHERE slug = ?", [slug]);
      if (existe) return res.status(409).json({ error: "Slug já em uso" });

      await db.run(
        "INSERT INTO barbearias (nome, slug, cidade, ativo) VALUES (?, ?, ?, 1)",
        [nome, slug, cidade]
      );
      const nova = await db.get("SELECT * FROM barbearias WHERE slug = ?", [slug]);
      res.status(201).json(nova);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao criar barbearia" });
    }
  });

  // Atualizar barbearia
  router.put("/:id", verificarSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let { nome, slug, cidade, ativo } = req.body;

      slug = slug?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      await db.run(
        "UPDATE barbearias SET nome = ?, slug = ?, cidade = ?, ativo = ? WHERE id = ?",
        [nome, slug, cidade, ativo, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar barbearia" });
    }
  });

  // Excluir barbearia
router.delete("/:id", verificarSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      await db.run("DELETE FROM agendamentos WHERE barbearia_id = ?", [id]);
      await db.run("DELETE FROM servicos WHERE barbearia_id = ?", [id]);
      await db.run("DELETE FROM usuarios WHERE barbearia_id = ?", [id]);

      const result = await db.run("DELETE FROM barbearias WHERE id = ?", [id]);
      
      if (result.changes === 0) return res.status(404).json({ error: "Não encontrada" });
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao excluir barbearia:", err); 
      res.status(500).json({ error: "Erro ao excluir barbearia" });
    }
  });

  return router;
}