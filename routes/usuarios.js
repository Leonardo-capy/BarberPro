import express from "express";
import { verificarAdmin, verificarLogin } from "../middleware/auth.js";
import bcrypt from "bcrypt";

export function usuarioRoutes(db) {
    const router = express.Router();

    router.get("/", verificarAdmin, async (req, res) => {
        try {
            const usuarios = await db.all(
                "SELECT id, usuario, role, plano FROM usuarios ORDER BY id"
            );
            res.json(usuarios);
        } catch (err) {
            res.status(500).json({ error: "Erro ao buscar usuarios" })
        }
    });

    router.get("/:id", verificarLogin, async (req, res) => {
        const { id } = req.params;
        const usuarioLogado = req.session.usuario;

        if (usuarioLogado.role !== "admin" && Number(id) !== usuarioLogado.id) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const usuario = await db.get(
            "SELECT id, usuario, role, plano, descricao FROM usuarios WHERE id = ?",
            [req.params.id]
        );

        if (!usuario) {
            return res.status(404).json({ error: "Usuario nao encontrado" });
        }

        res.json(usuario);
    });

    router.put("/:id", verificarAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { usuario, role, senha } = req.body;

            if (!usuario || !role) {
                return res.status(400).json({ error: "Dados inválidos: usuário e role são obrigatórios." });
            }

            await db.run(
                "UPDATE usuarios SET usuario = ?, role = ? WHERE id = ?",
                [usuario, role, id]
            );

            if (senha && senha.trim() !== "") {
                const hash = await bcrypt.hash(senha, 10);
                await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, id]);
            }

            res.json({ message: "Usuário atualizado com sucesso." });

        } catch (err) {
            console.error("Erro ao atualizar usuário:", err);
            res.status(500).json({ error: "Erro ao atualizar usuário no banco de dados." });
        }
    });

    router.delete("/:id", verificarAdmin, async (req, res) => {
        try {
            const { id } = req.params;

            if (Number(id) === req.session.userId) {
                return res.status(400).json({ error: "Voce nao pode excluir sua propria conta" });
            }

            const result = await db.run("DELETE FROM usuarios WHERE id = ?", [id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: "Usuario nao encontrado" });
            }

            res.json({ success: true })
        } catch (err) {
            res.status(500).json({ error: "Erro ao excluir usuario" })
        }
    });

    router.put("/:id/perfil-completo", verificarLogin, async (req, res) => {
        try {
            const { id } = req.params;
            const { senhaAtual, novaSenha, descricao } = req.body;
            const eu = req.session.usuario;

            await db.run("UPDATE usuarios SET descricao = ? WHERE id = ?", [descricao, id]);

            if (novaSenha) {
                if (eu.role !== 'admin' || eu.id == id) {
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

    return router
}