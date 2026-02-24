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
  saveUninitialized: false
}));

// 🔒 Middleware para proteger admin
function verificarAdmin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/login.html");
  }
}

async function startServer() {

  const db = await initDB();

  app.use("/api/agendamentos", agendamentoRoutes(db));

  // 🔐 LOGIN ADMIN
  app.post("/login", async (req, res) => {
    const {usuario, senha } = req.body;

    try {
      const admin = await db.get(
        "SELECT * FROM senha WHERE usuario = ? AND senha = ?",
        [usuario, senha]
      );
    

    if (admin) { // 🔥 troque essa senha
      req.session.admin = true;
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

  // 🔒 PROTEGER PÁGINAS ADMIN


const __dirname = process.cwd();

app.get("/admin.html", verificarAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin/admin.html"));
});

app.get("/admin-bloqueios.html", verificarAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin/admin-bloqueios.html"));
});

  // 🚪 Logout
  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login.html");
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

startServer();