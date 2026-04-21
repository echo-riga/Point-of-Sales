// services/itemService.ts
import db from "./db";

export const itemService = {
  getAll: () => {
    return db.getAllSync(`
      SELECT 
        i.id, i.name, i.color,
        c.id as category_id, c.name as category_name,
        s.id as subcategory_id, s.name as subcategory_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN subcategories s ON i.subcategory_id = s.id
    `);
  },

  getById: (id: number) => {
    return db.getFirstSync(
      `
      SELECT 
        i.id, i.name, i.color,
        c.id as category_id, c.name as category_name,
        s.id as subcategory_id, s.name as subcategory_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN subcategories s ON i.subcategory_id = s.id
      WHERE i.id = ?
    `,
      [id],
    );
  },

  create: (payload: {
    name: string;
    color: string;
    category_id?: number | null;
    subcategory_id?: number | null;
  }) => {
    const result = db.runSync(
      "INSERT INTO items (name, color, category_id, subcategory_id) VALUES (?, ?, ?, ?)",
      [
        payload.name,
        payload.color,
        payload.category_id ?? null,
        payload.subcategory_id ?? null,
      ],
    );
    return result.lastInsertRowId;
  },

  update: (
    id: number,
    payload: {
      name: string;
      color: string;
      category_id?: number | null;
      subcategory_id?: number | null;
    },
  ) => {
    db.runSync(
      "UPDATE items SET name = ?, color = ?, category_id = ?, subcategory_id = ? WHERE id = ?",
      [
        payload.name,
        payload.color,
        payload.category_id ?? null,
        payload.subcategory_id ?? null,
        id,
      ],
    );
  },

  delete: (id: number) => {
    db.runSync("DELETE FROM items WHERE id = ?", [id]);
  },
};