// services/expenseService.ts
import db from "@/services/db";

export interface ExpenseRow {
  id: number;
  date: string; // stored as 'YYYY-MM-DD'
  description: string;
  amount: number;
}

export interface CreateExpenseInput {
  date: string;
  description: string;
  amount: number;
}

export const expenseService = {
  getAll(): ExpenseRow[] {
    return db.getAllSync<ExpenseRow>(`
      SELECT id, date, description, amount
      FROM expenses
      ORDER BY date DESC, id DESC
    `);
  },

  getByDateRange(from: string, to: string): ExpenseRow[] {
    return db.getAllSync<ExpenseRow>(
      `SELECT id, date, description, amount
       FROM expenses
       WHERE date BETWEEN ? AND ?
       ORDER BY date DESC, id DESC`,
      [from, to],
    );
  },

  getTotalByDateRange(from: string, to: string): number {
    const row = db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE date BETWEEN ? AND ?`,
      [from, to],
    );
    return row?.total ?? 0;
  },

  create(input: CreateExpenseInput): number {
    const result = db.runSync(
      `INSERT INTO expenses (date, description, amount) VALUES (?, ?, ?)`,
      [input.date, input.description.trim(), input.amount],
    );
    return result.lastInsertRowId;
  },

  update(id: number, input: CreateExpenseInput): void {
    db.runSync(
      `UPDATE expenses SET date = ?, description = ?, amount = ? WHERE id = ?`,
      [input.date, input.description.trim(), input.amount, id],
    );
  },

  delete(id: number): void {
    db.runSync(`DELETE FROM expenses WHERE id = ?`, [id]);
  },
};
