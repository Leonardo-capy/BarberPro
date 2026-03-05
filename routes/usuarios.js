import express from "express";
import { verificarAdmin, verificarLogin } from "../middleware/auth.js";
import bcrypt from "bcrypt";

export function usuarioRoutes(db) {
    const router = express.Router();

    // ===============================
    // Rota pra  coisar o coiso
    // ===============================


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

        // Permite se for Admin OU se for o próprio usuário buscando seus dados
        if (usuarioLogado.role !== "admin" && Number(id) !== usuarioLogado.id) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const usuario = await db.get(
            "SELECT id, usuario, role, plano FROM usuarios WHERE id = ?",
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

            // 1. Validação básica de campos obrigatórios
            if (!usuario || !role) {
                return res.status(400).json({ error: "Dados inválidos: usuário e role são obrigatórios." });
            }

            // 2. Atualiza primeiro os dados básicos (Nome e Cargo)
            await db.run(
                "UPDATE usuarios SET usuario = ?, role = ? WHERE id = ?",
                [usuario, role, id]
            );

            // 3. Verificação condicional da Senha
            // Se a senha existir no corpo da requisição e não for apenas espaços...
            if (senha && senha.trim() !== "") {
                const saltRounds = 10;
                const hash = await bcrypt.hash(senha, saltRounds);

                await db.run(
                    "UPDATE usuarios SET senha = ? WHERE id = ?",
                    [hash, id]
                );
            }

            res.json({ message: "Usuário atualizado com sucesso (incluindo senha, se fornecida)." });

        } catch (err) {
            console.error("Erro ao atualizar usuário:", err);
            res.status(500).json({ error: "Erro ao atualizar usuário no banco de dados." });
        }
    });

    router.delete("/:id", verificarAdmin, async (req, res) => {
        try {
            const { id } = req.params;

            const result = await db.run(
                "DELETE FROM usuarios WHERE id = ?",
                [id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: "Usuario nao encontrado" });
            }

            if (Number(id) === req.session.userId) {
                return res.status(400).json({ error: "Voce nao pode excluir sua propria conta" });
            }

            res.json({ success: true })
        } catch (err) {
            res.status(500).json({ error: "Erro ao excluir usuario" })
        }
    });

    router.put("/:id/senha", verificarLogin, async (req, res) => {
        try {
            const { id } = req.params;
            const { senhaAtual, novaSenha } = req.body;
            const usuarioLogado = req.session.usuario; // Vem do seu auth.js

            const isAdmin = usuarioLogado.role === "admin";
            const eODonoDaConta = Number(id) === usuarioLogado.id;

            // Segurança: Só o dono ou o admin total podem mudar a senha
            if (!isAdmin && !eODonoDaConta) {
                return res.status(403).json({ error: "Você não tem permissão para alterar esta senha." });
            }

            // Se for o DONO tentando mudar a própria senha, exige a senha atual
            if (!isAdmin || eODonoDaConta) {
                const userNoBanco = await db.get("SELECT senha FROM usuarios WHERE id = ?", [id]);
                const senhaValida = await bcrypt.compare(senhaAtual, userNoBanco.senha);

                if (!senhaValida) {
                    return res.status(400).json({ error: "A senha atual está incorreta." });
                }
            }

            // Se for ADMIN mudando de outro, ele pula o 'if' acima e vem direto para o hash
            const saltRounds = 10;
            const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

            await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [novaSenhaHash, id]);

            res.json({ success: true, message: "Senha atualizada com sucesso!" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erro interno ao atualizar senha." });
        }
    });

    router.put("/:id/perfil-completo", verificarLogin, async (req, res) => {
        try {
            const { id } = req.params;
            const { senhaAtual, novaSenha, descricao } = req.body;
            const eu = req.session.usuario;

            // 1. Atualiza a descrição (qualquer um pode mudar a sua própria)
            await db.run("UPDATE usuarios SET descricao = ? WHERE id = ?", [descricao, id]);

            // 2. Se tentou mudar a senha, faz a verificação que já tínhamos
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