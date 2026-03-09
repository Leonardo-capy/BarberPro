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
            let { usuario, role, senha } = req.body;

            // Validação de tipos
            if (usuario !== undefined && typeof usuario !== 'string') {
                return res.status(400).json({ error: "Usuário deve ser uma string" });
            }
            if (role !== undefined && typeof role !== 'string') {
                return res.status(400).json({ error: "Role deve ser uma string" });
            }
            if (senha !== undefined && senha !== null && typeof senha !== 'string') {
                return res.status(400).json({ error: "Senha deve ser uma string" });
            }

            // Sanitização
            if (usuario) usuario = usuario.trim();
            if (role) role = role.trim();
            if (senha) senha = senha.trim();

            // Validações de negócio
            if (!usuario || usuario.length < 3) {
                return res.status(400).json({ error: "Usuário deve ter pelo menos 3 caracteres" });
            }

            const rolesValidas = ['admin', 'barbeiro'];
            if (role && !rolesValidas.includes(role)) {
                return res.status(400).json({ error: "Role deve ser 'admin' ou 'barbeiro'" });
            }

            if (senha && senha.length < 6) {
                return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
            }

            // Verificar se usuário existe
            const existente = await db.get("SELECT id FROM usuarios WHERE id = ?", [id]);
            if (!existente) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }

            // Atualizar nome e role
            if (role) {
                await db.run(
                    "UPDATE usuarios SET usuario = ?, role = ? WHERE id = ?",
                    [usuario, role, id]
                );
            } else {
                await db.run(
                    "UPDATE usuarios SET usuario = ? WHERE id = ?",
                    [usuario, id]
                );
            }

            // Atualizar senha se fornecida
            if (senha) {
                const hash = await bcrypt.hash(senha, 10);
                await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, id]);
            }

            res.json({ success: true, message: "Usuário atualizado com sucesso." });

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