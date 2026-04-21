// services/subcategoryService.ts
import db from "./db";

export const subcategoryService = {
  getAll: () => db.getAllSync("SELECT * FROM subcategories"),

  getByCategory: (category_id: number) => {
    return db.getAllSync("SELECT * FROM subcategories WHERE category_id = ?", [
      category_id,
    ]);
  },

  getById: (id: number) =>
    db.getFirstSync("SELECT * FROM subcategories WHERE id = ?", [id]),

  create: (payload: { name: string; category_id: number; color: string }) => {
    const result = db.runSync(
      "INSERT INTO subcategories (name, category_id, color) VALUES (?, ?, ?)",
      [payload.name, payload.category_id, payload.color],
    );
    return result.lastInsertRowId;
  },

  update: (id: number, payload: { name: string; color: string }) => {
    db.runSync("UPDATE subcategories SET name = ?, color = ? WHERE id = ?", [
      payload.name,
      payload.color,
      id,
    ]);
  },

  delete: (id: number) => {
    db.runSync("DELETE FROM subcategories WHERE id = ?", [id]);
  },
};