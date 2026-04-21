// services/db.ts
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("pos.db");

export function setupDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#16a34a'
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#2563eb',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      subcategory_id INTEGER,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#f0fdf4',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payment_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      requires_reference INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_type_id INTEGER,
      reference_number TEXT,
      date TEXT NOT NULL,
      total_qty INTEGER NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER,
      item_id INTEGER,
      price REAL NOT NULL,
      qty INTEGER NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL
    );
  `);

  // ── Migrations: safely add color columns to existing DBs ──────────────────
  const migrations = [
    "ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '#16a34a'",
    "ALTER TABLE subcategories ADD COLUMN color TEXT NOT NULL DEFAULT '#2563eb'",
    "ALTER TABLE items ADD COLUMN color TEXT NOT NULL DEFAULT '#f0fdf4'",
  ];
  for (const sql of migrations) {
    try {
      db.execSync(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

export default db;