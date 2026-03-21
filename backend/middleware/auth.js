export function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

export function verificarBarbeiroOuAdmin(req, res, next) {
  if (!req.session.usuario) return res.status(401).json({ error: "Não autenticado" });
  const role = req.session.usuario.role;
  if (["barbeiro", "admin", "superadmin"].includes(role)) return next();
  return res.status(403).json({ error: "Acesso negado" });
}

// Admin da barbearia (role = admin ou superadmin)
export function verificarAdmin(req, res, next) {
  if (!req.session.usuario) return res.status(401).json({ error: "Não autenticado" });
  const role = req.session.usuario.role;
  if (role === "admin" || role === "superadmin") return next();
  return res.status(403).json({ erro: "Acesso negado" });
}

// Só superadmin (dono da plataforma)
export function verificarSuperAdmin(req, res, next) {
  if (!req.session.usuario) return res.status(401).json({ error: "Não autenticado" });
  if (req.session.usuario.role === "superadmin") return next();
  return res.status(403).json({ error: "Acesso negado" });
}

// Mantido por compatibilidade
export const verificarAdminTotal = verificarSuperAdmin;