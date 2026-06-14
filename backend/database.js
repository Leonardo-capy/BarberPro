import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Adapta a interface para manter compatibilidade com o código existente
// (db.get, db.all, db.run) sem precisar alterar nenhuma rota
const db = {
  get: async (sql, params = []) => {
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  },
  all: async (sql, params = []) => {
    const { rows } = await pool.query(sql, params);
    return rows;
  },
  run: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return { changes: result.rowCount, lastID: result.rows[0]?.id ?? null };
  },
  exec: async (sql) => {
    await pool.query(sql);
  }
};

export async function initDB() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS barbearias (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      cidade TEXT,
      ativo INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      barbearia_id INTEGER NOT NULL,
      usuario TEXT NOT NULL,
      senha TEXT NOT NULL,
      plano TEXT DEFAULT 'ativo',
      role TEXT DEFAULT 'barbeiro',
      descricao TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      UNIQUE(barbearia_id, usuario)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      servico TEXT NOT NULL,
      preco REAL DEFAULT 0,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      finalizado INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bloqueios (
      id SERIAL PRIMARY KEY,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS servicos (
      id SERIAL PRIMARY KEY,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  // Seed inicial
  const temBarbearia = await db.get('SELECT id FROM barbearias LIMIT 1');
  if (!temBarbearia) {
    await db.run(
      'INSERT INTO barbearias (nome, slug, cidade, ativo) VALUES ($1, $2, $3, $4)',
      ['BarberPro Demo', 'barberpro-demo', 'Naviraí', 1]
    );
    const barbearia = await db.get("SELECT id FROM barbearias WHERE slug = 'barberpro-demo'");

    const senhaAdmin = await bcrypt.hash('123456', 10);
    await db.run(
      'INSERT INTO usuarios (barbearia_id, usuario, senha, plano, role) VALUES ($1, $2, $3, $4, $5)',
      [barbearia.id, 'admin', senhaAdmin, 'ativo', 'superadmin']
    );

    const senhaBarbeiro = await bcrypt.hash('654321', 10);
    await db.run(
      'INSERT INTO usuarios (barbearia_id, usuario, senha, plano, role) VALUES ($1, $2, $3, $4, $5)',
      [barbearia.id, 'lucas', senhaBarbeiro, 'ativo', 'barbeiro']
    );
    const barbeiro = await db.get("SELECT id FROM usuarios WHERE usuario = 'lucas'");

    await db.run('INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES ($1, $2, $3, $4)', [barbearia.id, barbeiro.id, 'Corte', 35.0]);
    await db.run('INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES ($1, $2, $3, $4)', [barbearia.id, barbeiro.id, 'Barba', 25.0]);
    await db.run('INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES ($1, $2, $3, $4)', [barbearia.id, barbeiro.id, 'Corte + Barba', 55.0]);
  }

  return db;
}