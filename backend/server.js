import 'dotenv/config';
import express from "express";
import cors from "cors";
import session from "express-session";
import { initDB } from "./database.js";
import { agendamentoRoutes } from "./routes/agendamentos.js";
import { usuarioRoutes } from "./routes/usuarios.js";
import { barbeariasRoutes } from "./routes/barbearias.js";
import path from "path";
import { fileURLToPath } from 'url';
import { verificarLogin, verificarAdmin, verificarSuperAdmin, verificarBarbeiroOuAdmin } from "./middleware/auth.js";
import bcrypt from "bcrypt";
import helmet from "helmet";
import { validateUserInput } from "./middleware/validate.js";
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://barbermaxpro.vercel.app'
    : 'http://localhost:3001',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));

if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error("❌ ERRO CRÍTICO: SESSION_SECRET não definido em produção!");
    process.exit(1);
  } else {
    console.warn("⚠️  SESSION_SECRET não definido. Usando valor temporário.");
  }
}
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

async function startServer() {
  const db = await initDB();

  app.use("/api/agendamentos", agendamentoRoutes(db));
  app.use("/api/usuarios", usuarioRoutes(db));
  app.use("/api/barbearias", barbeariasRoutes(db));

  // Usuário logado
  app.get("/api/usuario-logado", (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ error: "Não autenticado" });
    res.json(req.session.usuario);
  });

  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Não autenticado" });
    const usuario = await db.get(
      "SELECT id, usuario, plano, role, descricao, barbearia_id FROM usuarios WHERE id = $1",
      [req.session.userId]
    );
    res.json(usuario);
  });

  // ========================
  // Login
  // ========================
  app.post("/login", async (req, res) => {
    try {
      const { usuario, senha } = req.body;
      const barbeariaRaw = req.body.barbearia_id;
      const isSuperAdminLogin = barbeariaRaw === 'superadmin' || !barbeariaRaw;
      const barbearia_id = isSuperAdminLogin ? null : Number(barbeariaRaw);

      console.log(`[LOGIN RECEBIDO] usuario="${usuario}" barbeariaRaw="${barbeariaRaw}" barbearia_id=${barbearia_id} isSuperAdmin=${isSuperAdminLogin}`);

      let user;
      if (isSuperAdminLogin) {
        user = await db.get(
          "SELECT * FROM usuarios WHERE usuario = $1 AND role = 'superadmin'",
          [usuario]
        );
      } else {
        user = await db.get(
          "SELECT * FROM usuarios WHERE usuario = $1 AND barbearia_id = $2",
          [usuario, barbearia_id]
        );
      }

      let senhaValida = false;
      if (user) {
        senhaValida = await bcrypt.compare(senha, user.senha);
      } else {
        await bcrypt.compare(senha, '$2b$10$' + 'x'.repeat(53));
      }

      console.log(`[LOGIN] user encontrado: ${user ? user.usuario + ' id=' + user.id + ' barbearia=' + user.barbearia_id : 'NÃO'} | senhaValida: ${senhaValida}`);

      if (!user || !senhaValida)
        return res.status(401).json({ erro: "Credenciais inválidas" });

      const barbearia = await db.get("SELECT ativo FROM barbearias WHERE id = $1", [user.barbearia_id]);
      if (!barbearia?.ativo && user.role !== 'superadmin')
        return res.status(403).json({ erro: "Barbearia inativa. Entre em contato com o suporte." });

      req.session.userId = user.id;
      req.session.usuario = {
        id: user.id,
        usuario: user.usuario,
        role: user.role,
        barbearia_id: user.barbearia_id
      };

      res.json({ success: true, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro no login" });
    }
  });

  // Logout
  app.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // ========================
  // Serviços do usuário logado
  // ========================
  app.get("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const barbeariaId = req.session.usuario.barbearia_id;
    const servicos = await db.all(
      "SELECT * FROM servicos WHERE user_id = $1 AND barbearia_id = $2",
      [userId, barbeariaId]
    );
    res.json(servicos);
  });

  app.post("/api/servicos", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const barbeariaId = req.session.usuario.barbearia_id;
    const { nome, preco } = req.body;
    await db.run(
      "INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES ($1, $2, $3, $4)",
      [barbeariaId, userId, nome, preco]
    );
    res.json({ success: true });
  });

  app.delete("/api/servicos/:id", verificarLogin, async (req, res) => {
    const userId = req.session.userId;
    const barbeariaId = req.session.usuario.barbearia_id;
    await db.run(
      "DELETE FROM servicos WHERE id = $1 AND user_id = $2 AND barbearia_id = $3",
      [req.params.id, userId, barbeariaId]
    );
    res.json({ success: true });
  });

  // ========================
  // Dashboard do barbeiro/admin
  // ========================
  app.get("/api/admin/dashboard", verificarBarbeiroOuAdmin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;

      const totalAgendamentos = await db.get(
        "SELECT COUNT(*) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1",
        [barbeariaId]
      );
      const faturamentoTotal = await db.get(
        "SELECT SUM(preco) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1",
        [barbeariaId]
      );
      const totalClientes = await db.get(
        "SELECT COUNT(DISTINCT telefone) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1",
        [barbeariaId]
      );
      const barbeiroTop = await db.get(`
        SELECT u.usuario, SUM(a.preco) as total
        FROM agendamentos a
        JOIN usuarios u ON u.id = a.user_id
        WHERE a.barbearia_id = $1 AND a.finalizado = 1
        GROUP BY a.user_id, u.usuario
        ORDER BY total DESC
        LIMIT 1
      `, [barbeariaId]);
      const servicoTop = await db.get(`
        SELECT servico, COUNT(*) as total
        FROM agendamentos
        WHERE barbearia_id = $1 AND finalizado = 1
        GROUP BY servico
        ORDER BY total DESC
        LIMIT 1
      `, [barbeariaId]);

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

  // ========================
  // Faturamento da barbearia inteira (admin da barbearia)
  // ========================
  app.get("/api/admin/faturamento-barbearia", verificarAdmin, async (req, res) => {
    try {
      const barbeariaId = req.session.usuario.barbearia_id;
      const hoje = new Date();
      const diaHoje = hoje.toISOString().split('T')[0];
      const mesHoje = diaHoje.substring(0, 7);
      const anoHoje = diaHoje.substring(0, 4);

      const [total, diario, mensal, anual, porBarbeiro, atendimentos, clientes] = await Promise.all([
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1", [barbeariaId]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1 AND data = $2", [barbeariaId, diaHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1 AND TO_CHAR(data::date, 'YYYY-MM') = $2", [barbeariaId, mesHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1 AND TO_CHAR(data::date, 'YYYY') = $2", [barbeariaId, anoHoje]),
        db.all(`SELECT u.usuario, SUM(a.preco) as total, COUNT(*) as atendimentos
                FROM agendamentos a
                JOIN usuarios u ON u.id = a.user_id
                WHERE a.barbearia_id = $1 AND a.finalizado = 1
                GROUP BY a.user_id, u.usuario
                ORDER BY total DESC`, [barbeariaId]),
        db.get("SELECT COUNT(*) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1", [barbeariaId]),
        db.get("SELECT COUNT(DISTINCT telefone) as total FROM agendamentos WHERE barbearia_id = $1 AND finalizado = 1", [barbeariaId]),
      ]);

      res.json({
        total: total?.total || 0,
        diario: diario?.total || 0,
        mensal: mensal?.total || 0,
        anual: anual?.total || 0,
        totalAtendimentos: atendimentos?.total || 0,
        totalClientes: clientes?.total || 0,
        porBarbeiro
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao calcular faturamento da barbearia" });
    }
  });

  // ========================
  // Faturamento geral de toda a plataforma (superadmin)
  // ========================
  app.get("/api/admin/faturamento-geral", verificarSuperAdmin, async (req, res) => {
    try {
      const hoje = new Date();
      const diaHoje = hoje.toISOString().split('T')[0];
      const mesHoje = diaHoje.substring(0, 7);
      const anoHoje = diaHoje.substring(0, 4);

      const [total, diario, mensal, anual, porBarbearia, atendimentos, clientes] = await Promise.all([
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE finalizado = 1"),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE finalizado = 1 AND data = $1", [diaHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE finalizado = 1 AND TO_CHAR(data::date, 'YYYY-MM') = $1", [mesHoje]),
        db.get("SELECT SUM(preco) as total FROM agendamentos WHERE finalizado = 1 AND TO_CHAR(data::date, 'YYYY') = $1", [anoHoje]),
        db.all(`SELECT b.nome, SUM(a.preco) as total, COUNT(*) as atendimentos
                FROM agendamentos a
                JOIN barbearias b ON b.id = a.barbearia_id
                WHERE a.finalizado = 1
                GROUP BY a.barbearia_id, b.nome
                ORDER BY total DESC`),
        db.get("SELECT COUNT(*) as total FROM agendamentos WHERE finalizado = 1"),
        db.get("SELECT COUNT(DISTINCT telefone) as total FROM agendamentos WHERE finalizado = 1"),
      ]);

      res.json({
        total: total?.total || 0,
        diario: diario?.total || 0,
        mensal: mensal?.total || 0,
        anual: anual?.total || 0,
        totalAtendimentos: atendimentos?.total || 0,
        totalClientes: clientes?.total || 0,
        porBarbearia
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao calcular faturamento geral" });
    }
  });

  // ========================
  // Faturamento de um barbeiro específico (admin da barbearia)
  // ========================
  app.get("/api/admin/barbeiro/:id/faturamento", verificarAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const barbeariaId = req.session.usuario.barbearia_id;

      const faturamento = await db.get(
        "SELECT SUM(preco) as total FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1",
        [id, barbeariaId]
      );
      const agendamentos = await db.all(
        "SELECT nome, servico, preco, data, horario FROM agendamentos WHERE user_id = $1 AND barbearia_id = $2 AND finalizado = 1 ORDER BY data DESC, horario DESC LIMIT 20",
        [id, barbeariaId]
      );

      res.json({ total: faturamento?.total || 0, agendamentos });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar faturamento" });
    }
  });

  // ========================
  // Painel superadmin — gerenciar usuários de qualquer barbearia
  // ========================
  app.get("/api/admin/usuarios", verificarAdmin, async (req, res) => {
    try {
      const eu = req.session.usuario;
      const { barbearia_id } = req.query;
      const barbeariaAlvo = eu.role === 'admin' ? eu.barbearia_id : barbearia_id;

      if (barbeariaAlvo) {
        const usuarios = await db.all(
          `SELECT id, usuario, role, barbearia_id FROM usuarios
           WHERE barbearia_id = $1 OR role = 'superadmin'
           ORDER BY id ASC`,
          [barbeariaAlvo]
        );
        return res.json(usuarios);
      }

      const usuarios = await db.all("SELECT id, usuario, role, barbearia_id FROM usuarios");
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar usuários" });
    }
  });

  app.post("/api/admin/usuarios", verificarAdmin, validateUserInput, async (req, res) => {
    try {
      const eu = req.session.usuario;
      const { usuario, senha, role, barbearia_id } = req.body;

      const barbeariaAlvo = eu.role === 'superadmin' ? Number(barbearia_id) : eu.barbearia_id;
      if (!barbeariaAlvo) return res.status(400).json({ error: "barbearia_id é obrigatório" });

      if (eu.role === 'admin' && role === 'superadmin')
        return res.status(403).json({ error: "Sem permissão para criar superadmin" });

      const senhaHash = await bcrypt.hash(senha, 10);
      await db.run(
        "INSERT INTO usuarios (barbearia_id, usuario, senha, role) VALUES ($1, $2, $3, $4)",
        [barbeariaAlvo, usuario, senhaHash, role]
      );
      const criado = await db.get(
        "SELECT id, usuario, barbearia_id, role FROM usuarios WHERE usuario = $1 AND barbearia_id = $2",
        [usuario, barbeariaAlvo]
      );
      console.log(`[CRIAR USUARIO] criado:`, criado);
      res.json({ mensagem: "Usuário criado com sucesso" });
    } catch (err) {
      console.error(err);
      if (err.message?.includes('unique') || err.message?.includes('UNIQUE')) {
        return res.status(409).json({ error: "Já existe um usuário com esse nome nesta barbearia." });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.put("/api/admin/usuarios/:id", verificarAdmin, async (req, res) => {
    try {
      const eu = req.session.usuario;
      const { id } = req.params;
      let { usuario, role, senha } = req.body;

      if (eu.role === 'admin') {
        const alvo = await db.get("SELECT barbearia_id FROM usuarios WHERE id = $1", [id]);
        if (!alvo || alvo.barbearia_id !== eu.barbearia_id)
          return res.status(403).json({ error: "Sem permissão" });
        if (role === 'superadmin')
          return res.status(403).json({ error: "Sem permissão para definir superadmin" });
      }

      if (usuario) usuario = usuario.trim();
      if (role) role = role.trim();

      if (!usuario || usuario.length < 3)
        return res.status(400).json({ error: "Usuário deve ter pelo menos 3 caracteres" });

      await db.run(
        "UPDATE usuarios SET usuario = $1, role = $2 WHERE id = $3",
        [usuario, role, id]
      );

      if (senha && senha.trim() !== "") {
        const hash = await bcrypt.hash(senha, 10);
        await db.run("UPDATE usuarios SET senha = $1 WHERE id = $2", [hash, id]);
      }

      res.json({ success: true, message: "Usuário atualizado com sucesso" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/admin/usuarios/:id", verificarAdmin, async (req, res) => {
    try {
      const eu = req.session.usuario;
      const { id } = req.params;

      const alvo = await db.get("SELECT id, role, barbearia_id FROM usuarios WHERE id = $1", [id]);
      if (!alvo) return res.status(404).json({ error: "Usuário não encontrado" });

      if (alvo.role === 'superadmin')
        return res.status(403).json({ error: "Não é possível excluir o superadmin" });

      if (eu.role === 'admin' && alvo.barbearia_id !== eu.barbearia_id)
        return res.status(403).json({ error: "Sem permissão" });

      // Limpa registros dependentes antes de excluir o usuário
      await db.run("DELETE FROM agendamentos WHERE user_id = $1", [id]);
      await db.run("DELETE FROM bloqueios WHERE user_id = $1", [id]);
      await db.run("DELETE FROM servicos WHERE user_id = $1", [id]);

      await db.run("DELETE FROM usuarios WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  });

  // ========================
  // Frontend (produção)
  // ========================
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/build');
    app.use(express.static(frontendPath));
    app.use((req, res, next) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/login') && !req.path.startsWith('/logout')) {
        return res.sendFile(path.join(frontendPath, 'index.html'));
      }
      next();
    });
  }

  app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
  );
}

startServer();