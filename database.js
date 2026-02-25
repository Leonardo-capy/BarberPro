import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function initDB() {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database
  });

  //  Tabela de usuários (substitui "senha")
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      plano TEXT DEFAULT 'ativo',
      data_vencimento DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  //  Agendamentos vinculados ao usuário
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      servico TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id)
    )
  `);

  //  Bloqueios vinculados ao usuário
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

  //  Criar admin padrão se não existir nenhum usuário
  const row = await db.get("SELECT id FROM usuarios LIMIT 1");

  if (!row) {
    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano) VALUES (?, ?, ?)",
      ["admin", "123456", "ativo"]
    );

    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano) VALUES (?, ?, ?)",
      ["lucas", "654321", "ativo"]
    );
  }

  return db;
}
