import express from "express";
import cors from "cors";
import session from "express-session";
import { initDB } from "./database.js";
import { agendamentoRoutes } from "./routes/agendamentos.js";
import { usuarioRoutes } from "./routes/usuarios.js";
import path from "path";
import { fileURLToPath } from 'url';
import { verificarLogin, verificarBarbeiroOuAdmin, verificarAdminTotal } from "./middleware/auth.js";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log("SERVIDOR INICIADO");

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "barberpro-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

async function startServer() {
  const db = await initDB();

  // Rotas
  app.use("/api/agendamentos", agendamentoRoutes(db));
  app.use("/api/usuarios", usuarioRoutes(db));

  // Retorna dados do usuário logado
  app.get("/api/usuario-logado", (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ error: "Não autenticado" });
    res.json(req.session.usuario);
  });

  // Servir arquivos estáticos do admin
  app.use("/admin", express.static(path.join(__dirname, "admin")));

  // Lista usuários (apenas admin)
  app.get("/api/admin/usuarios", verificarAdminTotal, async (req, res) => {
    try {
      const usuarios = await db.all("SELECT id, usuario, role FROM usuarios");
      res.json(usuarios);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao carregar usuários" });
    }
  });

  // Atualizar usuário
  app.put("/api/admin/usuarios/:id", verificarAdminTotal, async (req, res) => {
    try {
      const { id } = req.params;
      const { usuario, role, senha } = req.body;

      if (!usuario) {
        return res.status(400).json({ error: "Nome invalido" });
      }

      if (Number(id) === 1) {
        await db.run(
          "UPDATE usuarios SET usuario = ? WHERE id = ?",
          [usuario.trim(), id]
        );
        return res.json({ success: true });
      }

      if (!["admin", "barbeiro"].includes(role)) {
        return res.status(400).json({ error: "Role invalida" });
      }

      await db.run(
        "UPDATE usuarios SET usuario = ?, role = ? WHERE id = ?",
        [usuario.trim(), role, id]
      );

      if (senha && senha.trim() !== "") {
        const hash = await bcrypt.hash(senha, 10);
        await db.run("UPDATE usuarios SET senha = ? WHERE id = ?", [hash, id]);
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao atualizar usuario" });
    }
  });

  // Criar usuário
  app.post("/api/admin/usuarios", verificarAdminTotal, async (req, res) => {
    try {
      const { usuario, senha, role } = req.body;
      const senhaHash = await bcrypt.hash(senha, 10);
      await db.run(
        "INSERT INTO usuarios (usuario, senha, role) VALUES (?, ?, ?)",
        [usuario, senhaHash, role]
      );
      res.json({ mensagem: "Usuário criado com sucesso" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  // Excluir usuário
  app.delete("/api/admin/usuarios/:id", verificarAdminTotal, async (req, res) => {
    try {
      const usuarioId = req.params.id;
      const result = await db.run("DELETE FROM usuarios WHERE id = ?", [usuarioId]);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  });

  // Login
  app.post("/login", async (req, res) => {
    try {
      const { usuario, senha } = req.body;
      const user = await db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);
      
      if (!user) return res.status(401).json({ erro: "Credenciais inválidas" });

      const senhaValida = await bcrypt.compare(senha, user.senha);
      if (!senhaValida) return res.status(401).json({ erro: "Credenciais inválidas" });

      req.session.userId = user.id;
      req.session.usuario = { id: user.id, usuario: user.usuario, role: user.role };

      res.json({ success: true, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro no login" });
    }
  });

  // Logout
  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect("/login.html");
    });
  });

  // Dados do usuário atual
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Não autenticado" });

    const usuario = await db.get(
      "SELECT id, usuario, plano, role, descricao FROM usuarios WHERE id = ?",
      [req.session.userId]
    );

    res.json(usuario);
  });

  // Serviços do usuário logado
  app.get("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const servicos = await db.all("SELECT * FROM servicos WHERE user_id = ?", [userId]);
    res.json(servicos);
  });

  app.post("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const { nome, preco } = req.body;
    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [userId, nome, preco]
    );
    res.json({ success: true });
  });

  app.delete("/api/servicos/:id", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const servicoId = req.params.id;
    await db.run(
      "DELETE FROM servicos WHERE id = ? AND user_id = ?",
      [servicoId, userId]
    );
    res.json({ success: true });
  });

  // Lista barbeiros ativos
  app.get("/api/barbeiros", async (req, res) => {
    try {
      const barbeiros = await db.all(
        "SELECT id, usuario FROM usuarios WHERE plano = 'ativo'"
      );
      res.json(barbeiros);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar barbeiros." });
    }
  });

  // Dashboard admin
  app.get("/api/admin/dashboard", verificarBarbeiroOuAdmin, async (req, res) => {
    try {
      const totalAgendamentos = await db.get(
        "SELECT COUNT(*) as total FROM agendamentos WHERE finalizado = 1"
      );
      const faturamentoTotal = await db.get(
        "SELECT SUM(preco) as total FROM agendamentos WHERE finalizado = 1"
      );
      const totalClientes = await db.get(
        "SELECT COUNT(DISTINCT telefone) as total FROM agendamentos WHERE finalizado = 1"
      );
      const barbeiroTop = await db.get(`
        SELECT u.usuario, SUM(a.preco) as total
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.user_id
        WHERE a.finalizado = 1
        GROUP BY a.user_id
        ORDER BY total DESC
        LIMIT 1
      `);
      const servicoTop = await db.get(`
        SELECT servico, COUNT(*) as total
        FROM agendamentos
        WHERE finalizado = 1
        GROUP BY servico
        ORDER BY total DESC
        LIMIT 1
      `);

      res.json({
        totalAgendamentos: totalAgendamentos?.total || 0,
        faturamentoTotal: faturamentoTotal?.total || 0,
        totalClientes: totalClientes?.total || 0,
        barbeiroTop: barbeiroTop || null,
        servicoTop: servicoTop || null
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao carregar dashboard" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => 
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
  );
}

startServer();