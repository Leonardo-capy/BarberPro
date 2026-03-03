export function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

//  Middleware para proteger rotas admin
export function verificarBarbeiroOuAdmin(req, res, next) {
  if (!req.session.usuario) return res.redirect("/");

  const role = req.session.usuario.role;
  if (role === "barbeiro" || role === "admin") return next();

  return res.redirect("/");
}


export function verificarAdminTotal(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const role = req.session.usuario.role;
  if (role === "admin") {
    return next();
  }

  return res.status(403).json({ error: "Acesso negado" });
}

export function verificarAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.role !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  next();
}