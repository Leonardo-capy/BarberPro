export function verificarLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

//  Middleware para proteger rotas admin
 export function verificarBarbeiroOuAdmin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/");
  }

  if (req.session.role === "barbeiro" || req.session.role === "admin") {
    return next();
  }
  return res.redirect("/")
}


export function verificarAdminTotal(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login.html")
  }

  if (req.session.role === "admin") {
    return next();
  }

  return res.redirect("/admin/admin.html")
}

export function verificarAdmin(req, res, next) {
  if (!req.session.usuario || req.session.role !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  next();
}