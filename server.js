import express from "express";
import cors from "cors";
import session from "express-session";
import { initDB } from "./database.js";
import { agendamentoRoutes } from "./routes/agendamentos.js";
import path from "path";
import { verificarLogin, verificarBarbeiroOuAdmin, verificarAdminTotal } from "./middleware/auth.js";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "barberpro-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
  }
}));


async function startServer() {

  const db = await initDB();



  //  Agora passamos o req para filtrar depois por userId
  app.use("/api/agendamentos", (req, res, next) => {
    req.db = db;
    next();
  }, agendamentoRoutes(db));

  //  LOGIN
  app.post("/login", async (req, res) => {
    const { usuario, senha } = req.body;

    try {
      const user = await db.get(
        "SELECT * FROM usuarios WHERE usuario = ? AND senha = ?",
        [usuario, senha]
      );

      if (user) {
        req.session.userId = user.id;
        req.session.usuario = {
          id: user.id,
          nome: user.nome,
          role: user.role
        };
        req.session.role = user.role;

        return res.json({
          success: true,
          role: user.role
        });

      } else {
        res.sendStatus(401);
      }

    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  const __dirname = process.cwd();

  app.get("/api/usuario-logado", (req, res) => {
    if (!req.session.usuario) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    res.json(req.session.usuario);
  });

  //  Páginas protegidas
  app.get("/admin.html", verificarBarbeiroOuAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "/admin/admin.html"));
  });

  app.get("/admin-bloqueios.html", verificarBarbeiroOuAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "/admin/admin-bloqueios.html"));
  });
  app.get("/admin-total.html", verificarAdminTotal, (req, res) => {
    res.sendFile(path.join(process.cwd(), "admin", "admin-total.html"));
  });

  app.get("/api/admin/usuarios", verificarAdminTotal, async (req, res) => {
    try {
      const usuarios = await db.all(
        "SELECT id, usuario, role FROM usuarios"
      );
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar usuarios" });
    }
  });

  app.delete("/api/admin/usuarios/:id", verificarAdminTotal, async (req, res) => {
    try {
      const { id } = req.params;

      await db.run("DELETE FROM usuarios WHERE id = ?", [id]);

      res.json({ mensagem: "Usuario removido com sucesso" });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao excluir usuario" })
    }
  });

  app.post("/api/admin/usuarios", async (req, res) => {
    try {
      const { usuario, senha, role } = req.body;

      if (!usuario || !senha || !role) {
        return res.status(400).json({ erro: "Dados incompletos" });
      }
      await db.run(
        "INSERT INTO usuarios (usuario, senha, role) VALUES (?, ?, ?)",
        [usuario, senha, role]
      );

      res.json({ mensagem: "Usuario criado com sucesso" });
    } catch (erro) {
      console.error("Erro ao criar usuario:", erro);
      res.status(500).json({ erro: "Erro interno" });
    }
  });



  app.post("/api/login", async (req, res) => {
    const { usuario, senha } = req.body;

    const user = await db.get(
      "SELECT * FROM usuarios WHERE usuario = ? AND senha = ?",
      [usuario, senha]
    );

    if (!user) {
      return res.status(401).json({ erro: "Credenciais invalidas" });
    };

    const token = jwt.sign(
      { id: user.id, role: user.role },
      "segredoSuperMegaSeguro",
      { expiresIn: "8h" }
    );

    res.json({ token });
  });

  // Logout
  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login.html");
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });

  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const usuario = await db.get(
      "SELECT id, usuario, plano FROM usuarios WHERE id = ?",
      [req.session.userId]
    );

    res.json(usuario);
  });

  app.get("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;

    const servicos = await db.all(
      "SELECT * FROM servicos WHERE user_id = ?",
      [userId]
    );

    res.json(servicos)
  });

  app.post("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const { nome, preco } = req.body;

    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [userId, nome, preco]
    );

    res.json({ success: true })
  });

  app.delete("/api/servicos/:id", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const servicoId = req.params.id;

    await db.run(
      "DELETE FROM servicos WHERE id = ? AND user_id = ?",
      [servicoId, userId]
    );

    res.json({ success: true })
  });

  app.get("/api/barbeiros", async (req, res) => {
    try {
      const barbeiros = await db.all(
        "SELECT id, usuario FROM usuarios WHERE plano = 'ativo'"
      );

      res.json(barbeiros);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar barbeiros." });
    }
  });

  app.get("/api/admin/dashboard", verificarBarbeiroOuAdmin, async (req, res) => {
    try {
      const totalAgendamentos = await db.get(`
        SELECT COUNT(*) as total
        FROM agendamentos
        WHERE finalizado = 1
        `);
      const faturamentoTotal = await db.get(`
        SELECT SUM(preco) as total
        FROM agendamentos
        WHERE finalizado = 1
        `);

      const totalClientes = await db.get(`
        SELECT COUNT(DISTINCT telefone) as total
        FROM agendamentos
        WHERE finalizado = 1
        `);

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
      res.status(500).json({ error: "Erro ao carregar dashboard" })
    }
  });
}

startServer();