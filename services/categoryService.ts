// services/categoryService.ts
import db from "./db";

export const categoryService = {
  getAll: () => db.getAllSync("SELECT * FROM categories"),

  getById: (id: number) =>
    db.getFirstSync("SELECT * FROM categories WHERE id = ?", [id]),

  create: (payload: { name: string; color: string }) => {
    const result = db.runSync(
      "INSERT INTO categories (name, color) VALUES (?, ?)",
      [payload.name, payload.color],
    );
    return result.lastInsertRowId;
  },

  update: (id: number, payload: { name: string; color: string }) => {
    db.runSync("UPDATE categories SET name = ?, color = ? WHERE id = ?", [
      payload.name,
      payload.color,
      id,
    ]);
  },

  delete: (id: number) => {
    db.runSync("DELETE FROM categories WHERE id = ?", [id]);
  },
};