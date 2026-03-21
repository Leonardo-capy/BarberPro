import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

export async function initDB() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  await db.exec(`PRAGMA foreign_keys = ON`);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS barbearias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      cidade TEXT,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id INTEGER NOT NULL,
      usuario TEXT NOT NULL,
      senha TEXT NOT NULL,
      plano TEXT DEFAULT 'ativo',
      role TEXT DEFAULT 'barbeiro',
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      UNIQUE(barbearia_id, usuario)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      servico TEXT NOT NULL,
      preco REAL DEFAULT 0,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      finalizado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bloqueios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbearia_id) REFERENCES barbearias(id),
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  // Seed inicial
  const temBarbearia = await db.get("SELECT id FROM barbearias LIMIT 1");
  if (!temBarbearia) {
    await db.run(
      "INSERT INTO barbearias (nome, slug, cidade, ativo) VALUES (?, ?, ?, ?)",
      ["BarberPro Demo", "barberpro-demo", "Naviraí", 1]
    );
    const barbearia = await db.get("SELECT id FROM barbearias WHERE slug = 'barberpro-demo'");

    const senhaAdmin = await bcrypt.hash("123456", 10);
    await db.run(
      "INSERT INTO usuarios (barbearia_id, usuario, senha, plano, role) VALUES (?, ?, ?, ?, ?)",
      [barbearia.id, "admin", senhaAdmin, "ativo", "superadmin"]
    );

    const senhaBarbeiro = await bcrypt.hash("654321", 10);
    await db.run(
      "INSERT INTO usuarios (barbearia_id, usuario, senha, plano, role) VALUES (?, ?, ?, ?, ?)",
      [barbearia.id, "lucas", senhaBarbeiro, "ativo", "barbeiro"]
    );
    const barbeiro = await db.get("SELECT id FROM usuarios WHERE usuario = 'lucas'");

    await db.run("INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES (?, ?, ?, ?)", [barbearia.id, barbeiro.id, "Corte", 35.0]);
    await db.run("INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES (?, ?, ?, ?)", [barbearia.id, barbeiro.id, "Barba", 25.0]);
    await db.run("INSERT INTO servicos (barbearia_id, user_id, nome, preco) VALUES (?, ?, ?, ?)", [barbearia.id, barbeiro.id, "Corte + Barba", 55.0]);
  }

  return db;
}