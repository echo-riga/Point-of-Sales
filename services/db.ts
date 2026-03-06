// services/db.ts
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("pos.db");

export function setupDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      subcategory_id INTEGER,
      name TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payment_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      requires_reference INTEGER NOT NULL DEFAULT 0  -- 0 = false, 1 = true
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_type_id INTEGER,
      reference_number TEXT,                          -- NULL for GCash or cash, filled for others
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
      date TEXT NOT NULL,               -- stored as 'YYYY-MM-DD'
      description TEXT NOT NULL,
      amount REAL NOT NULL
    );
  `);
}

export default db;
