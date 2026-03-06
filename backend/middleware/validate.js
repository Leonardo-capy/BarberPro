// middleware/validate.js
export function validateString(value, fieldName) {
  // Verificar se existe
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} é obrigatório`);
  }
  
  // ✅ Verificar se é string ANTES de acessar .length
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} deve ser uma string`);
  }
  
  // Agora é seguro acessar .length
  const trimmed = value.trim();
  return trimmed;
}

export function validateUserInput(req, res, next) {
  try {
    // Validar usuário
    if (req.body.usuario !== undefined) {
      // ✅ Já chamamos validateString que faz a verificação de tipo
      const usuario = validateString(req.body.usuario, 'Usuário');
      if (usuario.length < 3) {
        throw new Error('Usuário deve ter pelo menos 3 caracteres');
      }
      req.body.usuario = usuario;
    }

    // Validar senha
    if (req.body.senha !== undefined) {
      // ✅ Verificação de tipo primeiro
      if (req.body.senha !== null && typeof req.body.senha !== 'string') {
        throw new Error('Senha deve ser uma string');
      }
      
      // Só faz trim se for string
      if (typeof req.body.senha === 'string') {
        const senha = req.body.senha.trim();
        if (senha.length > 0 && senha.length < 3) {
          throw new Error('Senha deve ter pelo menos 3 caracteres');
        }
        req.body.senha = senha;
      }
    }

    // Validar role
    if (req.body.role !== undefined) {
      // ✅ Verificação de tipo
      if (typeof req.body.role !== 'string') {
        throw new Error('Role deve ser uma string');
      }
      
      const role = req.body.role.trim();
      const rolesValidas = ['admin', 'barbeiro'];
      if (!rolesValidas.includes(role)) {
        throw new Error('Role deve ser admin ou barbeiro');
      }
      req.body.role = role;
    }

    // Validar nome do serviço
    if (req.body.nome !== undefined) {
      // ✅ Usando validateString que já faz a verificação
      const nome = validateString(req.body.nome, 'Nome do serviço');
      if (nome.length < 2) {
        throw new Error('Nome do serviço deve ter pelo menos 2 caracteres');
      }
      req.body.nome = nome;
    }

    // Validar preço
    if (req.body.preco !== undefined) {
      // ✅ Verificação de tipo para número
      if (typeof req.body.preco !== 'number' && typeof req.body.preco !== 'string') {
        throw new Error('Preço deve ser um número');
      }
      
      const preco = Number(req.body.preco);
      if (isNaN(preco) || preco <= 0) {
        throw new Error('Preço deve ser um número positivo');
      }
      req.body.preco = preco;
    }

    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}