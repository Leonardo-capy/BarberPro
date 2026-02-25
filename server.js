import express from "express";
import cors from "cors";
import session from "express-session";
import { initDB } from "./database.js";
import { agendamentoRoutes } from "./routes/agendamentos.js";
import path from "path";

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

//  Middleware para proteger rotas admin
function verificarAdmin(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login.html");
  }
}

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
      const admin = await db.get(
        "SELECT * FROM usuarios WHERE usuario = ? AND senha = ?",
        [usuario, senha]
      );

      if (admin) {
        req.session.userId = admin.id; 
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }

    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });

  const __dirname = process.cwd();

  //  Páginas protegidas
  app.get("/admin.html", verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "admin/admin.html"));
  });

  app.get("/admin-bloqueios.html", verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "admin/admin-bloqueios.html"));
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
}

startServer();