import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

export async function initDB() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  // Tabela de usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      plano TEXT DEFAULT 'ativo',
      role TEXT DEFAULT 'barbeiro',
      data_vencimento DATETIME,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agendamentos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      servico TEXT NOT NULL,
      preco REAL DEFAULT 0,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      finalizado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  // Bloqueios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bloqueios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  // Servicos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  // Criar admin e Lucas se não existir ninguém
  const row = await db.get("SELECT id FROM usuarios LIMIT 1");
  if (!row) {
    const senhaAdmin = await bcrypt.hash("123456", 10);
    const senhaLucas = await bcrypt.hash("654321", 10);

    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano, role) VALUES (?, ?, ?, ?)",
      ["Chefe dos cabelo", senhaAdmin, "ativo", "admin"]
    );

    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano, role) VALUES (?, ?, ?, ?)",
      ["lucas", senhaLucas, "ativo", "barbeiro"]
    );
  }

  // Inserir serviços padrão
  const servicoUser1 = await db.get("SELECT id FROM servicos WHERE user_id = 1 LIMIT 1");
  if (!servicoUser1) {
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [1, "Corte", 35.0]);
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [1, "Barba", 25.0]);
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [1, "Corte + Barba", 55.0]);
  }

  const servicoUser2 = await db.get("SELECT id FROM servicos WHERE user_id = 2 LIMIT 1");
  if (!servicoUser2) {
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [2, "Corte", 25.0]);
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [2, "Barba", 15.0]);
    await db.run("INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)", [2, "Corte + Barba", 40.0]);
  }


  return db;
}