// services/paymentTypeService.ts
import db from "./db";

export interface PaymentType {
  id: number;
  name: string;
  requires_reference: number; // 0 = no, 1 = yes
}

export const paymentTypeService = {
  getAll: () =>
    db.getAllSync<PaymentType>("SELECT * FROM payment_types ORDER BY name"),

  getById: (id: number) =>
    db.getFirstSync<PaymentType>("SELECT * FROM payment_types WHERE id = ?", [
      id,
    ]),

  create: (payload: { name: string; requires_reference: boolean }) => {
    const result = db.runSync(
      "INSERT INTO payment_types (name, requires_reference) VALUES (?, ?)",
      [payload.name, payload.requires_reference ? 1 : 0],
    );
    return result.lastInsertRowId;
  },

  update: (
    id: number,
    payload: { name: string; requires_reference: boolean },
  ) => {
    db.runSync(
      "UPDATE payment_types SET name = ?, requires_reference = ? WHERE id = ?",
      [payload.name, payload.requires_reference ? 1 : 0, id],
    );
  },

  delete: (id: number) => {
    db.runSync("DELETE FROM payment_types WHERE id = ?", [id]);
  },

  requiresReference: (id: number): boolean => {
    const row = db.getFirstSync<{ requires_reference: number }>(
      "SELECT requires_reference FROM payment_types WHERE id = ?",
      [id],
    );
    return row?.requires_reference === 1;
  },
};
