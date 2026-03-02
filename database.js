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
    preco REAL DEFAULT 0,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    finalizado INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
  )
`);


  await db.exec(`
  ALTER TABLE agendamentos ADD COLUMN preco REAL DEFAULT 0
`).catch(() => { });

  await db.exec(`
  ALTER TABLE agendamentos ADD COLUMN finalizado INTEGER DEFAULT 0
`).catch(() => { });

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


  await db.exec(`
  ALTER TABLE usuarios ADD COLUMN role TEXT DEFAULT 'barbeiro'
  `).catch(() => { });

  //  Criar admin padrão se não existir nenhum usuário
  const row = await db.get("SELECT id FROM usuarios LIMIT 1");

  if (!row) {
    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano, role) VALUES (?, ?, ?, ?)",
      ["admin", "123456", "ativo", "admin"]
    );

    await db.run(
      "INSERT INTO usuarios (usuario, senha, plano, role) VALUES (?, ?, ?, ?)",
      ["lucas", "654321", "ativo", "barbeiro"]
    );
  }



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

  await db.exec(`
  ALTER TABLE agendamentos ADD COLUMN servico_id INTEGER
`).catch(() => { });

  // USER 1
  const servicoUser1 = await db.get(
    "SELECT id FROM servicos WHERE user_id = 1 LIMIT 1"
  );

  if (!servicoUser1) {
    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [1, "Corte", 35.0]
    );

    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [1, "Barba", 25.0]
    );

    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [1, "Corte + Barba", 55.0]
    );
  }

  // USER 2
  const servicoUser2 = await db.get(
    "SELECT id FROM servicos WHERE user_id = 2 LIMIT 1"
  );

  if (!servicoUser2) {
    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [2, "Corte", 25.0]
    );

    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [2, "Barba", 15.0]
    );

    await db.run(
      "INSERT INTO servicos (user_id, nome, preco) VALUES (?, ?, ?)",
      [2, "Corte + Barba", 40.0]
    );
  }

  return db;
}
